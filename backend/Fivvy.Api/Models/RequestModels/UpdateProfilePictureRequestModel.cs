
namespace Fivvy.Api.Models.RequestModels;

public class UpdateProfilePictureRequestModel
{
    // Accept base64 string from frontend
    public required string ProfilePicture { get; set; }
}