using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Helpers;
using System.Security.Claims;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Utils;

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
        try
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
                throw new InvalidOperationException();
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        catch (Exception error)
        {
            throw new Exception("An error occured", error);
        }
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

            if (!ValidatePassword.validatePassword(updateUser.Password, updateUser.PasswordVerify))
            {
                throw new InvalidOperationException("Password must be the same");
            }

            user.Username = updateUser.Username;
            user.Name = updateUser.Name;
            user.Surname = updateUser.Surname;
            user.Email = updateUser.Email;
            user.Password = BCrypt.Net.BCrypt.HashPassword(updateUser.Password);

            await _context.SaveChangesAsync();

            user.Password = string.Empty;
            return user;
        }
        catch (Exception error)
        {
            throw new Exception("Profile update failed", error);
        }
    }
}