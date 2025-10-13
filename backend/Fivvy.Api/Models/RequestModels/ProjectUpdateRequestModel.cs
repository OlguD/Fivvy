
namespace Fivvy.Api.Models;


public class ProjectUpdateRequestModel
{
    public string ProjectName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int ClientId { get; set; }
    public double ProjectPrice { get; set; }

    public int ProjectId { get; set; }
}