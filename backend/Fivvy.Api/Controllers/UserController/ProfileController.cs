
using Fivvy.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

public class ProfileController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public ProfileController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    [HttpGet("me/profile")]
    [Authorize]
    public async Task<UserModel> Profile()
    {
        var token = HttpContext.Request.Headers["Authorization"]
                .FirstOrDefault()?.Replace("Bearer ", "");

        if (string.IsNullOrEmpty(token))
        {
            throw new UnauthorizedAccessException("Authorization token is missing.");
        }

        return await _userRepository.Profile(token);
    }
}