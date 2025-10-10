
namespace Fivvy.Api.Models;


public class UpdateClientRequestModel
{
    public required int ClientId { get; set; }
    public required ClientModel ClientModel { get; set; }
}