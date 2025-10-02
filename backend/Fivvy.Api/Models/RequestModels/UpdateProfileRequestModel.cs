

namespace Fivvy.Api.Models.RequestModels;

public class UpdateProfileRequestModel
{
    public required string Username { get; set; }
    public required string Name { get; set; }
    public required string Surname { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public required string PasswordVerify { get; set; }
}