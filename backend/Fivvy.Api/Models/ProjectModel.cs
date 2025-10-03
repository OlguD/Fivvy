using System.ComponentModel.DataAnnotations;
namespace Fivvy.Api.Models;

public class ProjectModel
{
    [Key]
    public int Id { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    // public int ClientId { get; set; }
    public ClientModel? Client { get; set; }
}