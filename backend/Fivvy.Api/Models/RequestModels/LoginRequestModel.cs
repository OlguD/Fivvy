
namespace Fivvy.Api.Models.RequestModels;


public class LoginRequestModel
{
    public required string Username { get; set; }
    public required string Password { get; set; }
}