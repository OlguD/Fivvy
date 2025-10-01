using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Helpers;
using System.Security.Claims;

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
                throw new UsernameAlreadyExists();
            }

            if (existingEmail != null)
            {
                throw new EmailAlreadyExists();
            }

            if (string.IsNullOrEmpty(user.Username) ||
                string.IsNullOrEmpty(user.Name) ||
                string.IsNullOrEmpty(user.Surname) ||
                string.IsNullOrEmpty(user.Email) ||
                string.IsNullOrEmpty(user.Password))
            {
                throw new InvalidOperationException();
            }

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

    private int ExtractUserIdFromToken(string token)
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
}