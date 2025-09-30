namespace Fivvy.Api.Utils;

public class ValidatePassword
{
    public static bool validatePassword(string password1, string password2)
    {
        if (password1 == password2)
        {
            return true;
        }

        return false;
    }
}