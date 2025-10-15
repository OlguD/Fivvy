using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Fivvy.Api.Models;

public class UserModel
{
    [Key]
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string Name { get; set; }
    public required string Surname { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }

    public string? ProfileImagePath { get; set; }

    public ICollection<ClientModel> Clients { get; set; } = new List<ClientModel>();

    public float TotalIncome;
    public string Role { get; set; } = "user";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}