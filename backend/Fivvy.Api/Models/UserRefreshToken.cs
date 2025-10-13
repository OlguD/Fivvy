using System.ComponentModel.DataAnnotations;

namespace Fivvy.Api.Models;

public class UserRefreshToken
{
    [Key]
    public int Id { get; set; }
    public int UserId { get; set; }
    public string TokenHash { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokeAt { get; set; }
    public string? CreatedByIp { get; set; }
    public string? ReplacedByToken { get; set; }
    public UserModel User { get; set; } = default!;
}