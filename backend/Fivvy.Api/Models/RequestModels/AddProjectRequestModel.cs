
namespace Fivvy.Api.Models.RequestModels;


public class AddProjectRequestModel
{
    public string ProjectName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    // public int ClientId { get; set; }
    // public ClientModel? Client { get; set; }
    public required int ClientId { get; set; }
    public double ProjectPrice { get; set; }
}