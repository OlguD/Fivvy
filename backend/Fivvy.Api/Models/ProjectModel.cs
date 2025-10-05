using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Fivvy.Api.Models;

public class ProjectModel
{
    [Key]
    public int Id { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int ClientId { get; set; }

    [JsonIgnore]
    public ClientModel? Client { get; set; }
}