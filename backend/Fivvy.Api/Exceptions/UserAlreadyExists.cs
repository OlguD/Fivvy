
namespace Fivvy.Api.Exceptions;

public class UsernameAlreadyExists : Exception
{
    public UsernameAlreadyExists() : base("Username already exists") { }
    public UsernameAlreadyExists(string message, Exception innerException) : base(message, innerException) { }
}