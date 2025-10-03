
namespace Fivvy.Api.Models.RequestModels;


public class AddProjectRequestModel
{
    public required ProjectModel Project { get; set; }
    public required int ClientId { get; set; }
}