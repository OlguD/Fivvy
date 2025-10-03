
namespace Fivvy.Api.Exceptions;

public class ClientNotFoundException : Exception
{
    public ClientNotFoundException() : base("Client not found") { }
    public ClientNotFoundException(string message, Exception innerException) : base(message, innerException) { }
}