using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
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
            var existingUser = await _context.Users.
                FirstOrDefaultAsync(u => u.Username == user.Username);

            if (existingUser != null)
            {
                throw new UserAlreadyExists();
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
}