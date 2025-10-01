
namespace Fivvy.Api.Exceptions;

public class EmailAlreadyExists : Exception
{
    public EmailAlreadyExists() : base("Email already exists") { }
    public EmailAlreadyExists(string message, Exception innerException) : base(message, innerException) { }
}