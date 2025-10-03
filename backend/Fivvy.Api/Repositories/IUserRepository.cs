using Fivvy.Api.Models;
using Fivvy.Api.Models.RequestModels;

public interface IUserRepository
{
    Task<UserModel> GetUserByUsername(string username);
    Task AddUserAsync(UserModel user);
    Task<UserModel> Profile(string token);
    Task<UserModel> UpdateProfile(string token, UpdateProfileRequestModel updateUser);
    Task<UserModel> GetUserById(int userId);
    int ExtractUserIdFromToken(string token);
}