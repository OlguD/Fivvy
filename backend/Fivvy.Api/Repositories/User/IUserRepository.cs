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
    Task<bool> UpdatePasswordAsync(string token, UpdatePasswordRequestModel request);

    Task UpsertRefreshTokenAsync(int userId, string rawToken, string? createdByIp);
    Task<UserRefreshToken?> ValidateRefreshTokenAsync(string rawToken);
    Task RotateRefreshTokenAsync(int userId, string oldToken, string newToken);
    Task RevokeRefreshTokenAsync(string rawToken);
}