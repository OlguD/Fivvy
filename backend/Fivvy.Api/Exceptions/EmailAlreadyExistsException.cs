
namespace Fivvy.Api.Exceptions;

public class EmailAlreadyExistsException : Exception
{
    public EmailAlreadyExistsException() : base("Email already exists") { }
    public EmailAlreadyExistsException(string message, Exception innerException) : base(message, innerException) { }
}