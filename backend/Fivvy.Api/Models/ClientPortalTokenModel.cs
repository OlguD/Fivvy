using System.ComponentModel.DataAnnotations;
namespace Fivvy.Api.Models;


public class ClientPortalTokenModel
{
    [Key]
    public int Id { get; set; }
    public int ClientId { get; set; }
    public string TokenHash { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public bool IsUsed => UsedAt.HasValue;
}