using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Helpers;
using System.Security.Claims;
using Fivvy.Api.Models.RequestModels;
using System.Linq;

namespace Fivvy.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    private readonly JwtHelper _jwtHelper;

    public UserRepository(AppDbContext context, JwtHelper jwtHelper)
    {
        _context = context;
        _jwtHelper = jwtHelper;
    }

    public async Task<UserModel> GetUserById(int userId)
    {
        try
        {
            var existingUser = await _context.Users
                    .FirstOrDefaultAsync(i => i.Id == userId);

            if (existingUser != null)
            {    
                return existingUser;
            }
            else
            {
                throw new UserNotFoundException();
            }
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }

    public async Task<UserModel> GetUserByUsername(string username)
    {
        try
        {
            if (string.IsNullOrEmpty(username))
            {
                throw new UserNotFoundException();
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                throw new UserNotFoundException();
            }
            return user;
        }
        catch (UserNotFoundException error)
        {
            throw new UserNotFoundException("Error", error);
        }
    }

    public async Task AddUserAsync(UserModel user)
    {
        var existingUsername = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == user.Username);

        var existingEmail = await _context.Users
                .FirstOrDefaultAsync(e => e.Email == user.Email);

        if (existingUsername != null)
        {
            throw new UsernameAlreadyExistsException();
        }

        if (existingEmail != null)
        {
            throw new EmailAlreadyExistsException();
        }

        if (string.IsNullOrEmpty(user.Username) ||
            string.IsNullOrEmpty(user.Name) ||
            string.IsNullOrEmpty(user.Surname) ||
            string.IsNullOrEmpty(user.Email) ||
            string.IsNullOrEmpty(user.Password))
        {
            throw new InvalidOperationException("Missing required registration fields");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
    }


    public async Task<UserModel> Profile(string token)
    {
        try
        {
            var userId = ExtractUserIdFromToken(token);
            var user = await _context.Users
                .Include(u => u.Clients)
                    .ThenInclude(c => c.Projects)
                .Include(u => u.Clients)
                    .ThenInclude(c => c.Invoices)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new UserNotFoundException();
            }

            user.Password = string.Empty;
            return user;
        }
        catch (Exception error)
        {
            throw new Exception("Profile retrieval failed", error);
        }
    }

    public int ExtractUserIdFromToken(string token)
    {
        var principal = _jwtHelper.ValidateToken(token);

        if (principal == null)
        {
            throw new UnauthorizedAccessException("Invalid token");
        }

        var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }


    public async Task<UserModel> UpdateProfile(string token, UpdateProfileRequestModel updateUser)
    {
        try
        {
            var userId = ExtractUserIdFromToken(token);

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new UserNotFoundException();
            }

            user.Username = updateUser.Username;
            user.Name = updateUser.Name;
            user.Surname = updateUser.Surname;
            user.Email = updateUser.Email;
            user.CompanyName = updateUser.CompanyName;
            user.Address = updateUser.Address;
            user.City = updateUser.City;
            user.TaxValue = updateUser.TaxValue;

            await _context.SaveChangesAsync();

            user.Password = string.Empty;
            return user;
        }
        catch (Exception error)
        {
            throw new Exception("Profile update failed", error);
        }
    }

    public async Task<bool> UpdatePasswordAsync(string token, UpdatePasswordRequestModel request)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new UnauthorizedAccessException("Token can not be empty");
        }

        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || string.IsNullOrWhiteSpace(request.ConfirmPassword))
        {
            throw new InvalidOperationException("Password fields can not be empty");
        }

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Passwords must match");
        }

        var userId = ExtractUserIdFromToken(token);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            throw new UserNotFoundException();
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateProfileImagePathAsync(string token, string profileImagePath)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                throw new UnauthorizedAccessException("Token can not be empty");
            }
            var userId = ExtractUserIdFromToken(token);
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                throw new UserNotFoundException();
            }
            user.ProfileImagePath = profileImagePath;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }


    // Refresh token//

    public async Task UpsertRefreshTokenAsync(int userId, string rawToken, string? createdByIp)
    {
        var activeTokens = await _context.RefreshTokens
            .Where(t => t.UserId == userId && !t.RevokeAt.HasValue)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var token = activeTokens.FirstOrDefault();
        var hashed = RefreshTokenHelper.HashToken(rawToken);

        if (activeTokens.Count > 1)
        {
            foreach (var stale in activeTokens.Skip(1))
            {
                stale.RevokeAt = DateTime.UtcNow;
                stale.ReplacedByToken = hashed;
            }
        }

        if (token is null)
        {
            token = new UserRefreshToken
            {
                UserId = userId,
                TokenHash = hashed,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedByIp = createdByIp
            };
            _context.RefreshTokens.Add(token);
        }
        else
        {
            token.TokenHash = hashed;
            token.ExpiresAt = DateTime.UtcNow.AddDays(7);
            token.CreatedAt = DateTime.UtcNow;
            token.CreatedByIp = createdByIp;
            token.RevokeAt = null;
            token.ReplacedByToken = null;
        }

        await _context.SaveChangesAsync();
    }


    public async Task<UserRefreshToken?> ValidateRefreshTokenAsync(string rawToken)
    {
        var hash = RefreshTokenHelper.HashToken(rawToken);
        return await _context.RefreshTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash && !t.RevokeAt.HasValue);
    }

    public async Task RotateRefreshTokenAsync(int userId, string oldToken, string newToken)
    {
        var oldHash = RefreshTokenHelper.HashToken(oldToken);
        var entity = await _context.RefreshTokens.SingleOrDefaultAsync(
            t => t.UserId == userId && t.TokenHash == oldHash
        );

        if (entity is null)
        {
            return;
        }

        var replacement = new UserRefreshToken
        {
            UserId = userId,
            TokenHash = RefreshTokenHelper.HashToken(newToken),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = entity.CreatedByIp
        };
        _context.RefreshTokens.Add(replacement);

        await _context.SaveChangesAsync();
    }
    
    public async Task RevokeRefreshTokenAsync(string rawToken)
    {
        var hash = RefreshTokenHelper.HashToken(rawToken);
        var entity = await _context.RefreshTokens.SingleOrDefaultAsync(t => t.TokenHash == hash);
        if (entity is null) return;

        entity.RevokeAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
}