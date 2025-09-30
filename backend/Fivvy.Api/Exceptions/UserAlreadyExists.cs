
namespace Fivvy.Api.Exceptions;

public class UserAlreadyExists : Exception
{
    public UserAlreadyExists() : base("User already exists") { }
    public UserAlreadyExists(string message, Exception innerException) : base(message, innerException) { }
}