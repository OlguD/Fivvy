
namespace Fivvy.Api.Models.RequestModels;

public class UpdatePasswordRequestModel
{
    public required string NewPassword { get; set; }
    public required string ConfirmPassword { get; set; }
}