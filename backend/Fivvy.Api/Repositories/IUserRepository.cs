using Fivvy.Api.Models;

public interface IUserRepository
{
    Task<UserModel> GetUserByUsername(string username);
    Task AddUserAsync(UserModel user);
}