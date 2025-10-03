
namespace Fivvy.Api.Exceptions;

public class UsernameAlreadyExistsException : Exception
{
    public UsernameAlreadyExistsException() : base("Username already exists") { }
    public UsernameAlreadyExistsException(string message, Exception innerException) : base(message, innerException) { }
}