namespace Fivvy.Api.Models.RequestModels;

public class UpdateProfileRequestModel
{
    public required string Username { get; set; }
    public required string Name { get; set; }
    public required string Surname { get; set; }
    public required string Email { get; set; }
    public required int TaxValue { get; set; }
    public string? CompanyName { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
}