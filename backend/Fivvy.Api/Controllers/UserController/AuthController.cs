using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;

using Fivvy.Api.Models;
using Fivvy.Api.Repositories;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Utils;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public AuthController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }


    [HttpPost("login")]
    public async Task<IActionResult> UserLoginAsync([FromForm] LoginRequestModel request)
    {
        var user = await _userRepository.GetUserByUsername(request.Username);
        if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            return Ok(user);
        }
        return BadRequest("Invalid credentials");
    }

    [HttpPost("register")]
    public async Task<IActionResult> UserRegisterAsync([FromForm] RegisterRequestModel request)
    {
        if (ValidatePassword.validatePassword(request.Password, request.ValidatePassword))
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new UserModel
            {
                Username = request.Username,
                Name = request.Name,
                Surname = request.Surname,
                Email = request.Email,
                Password = hashedPassword,
                // Clients = [],
                // Invoices = [],
                // Projects = [],
                TotalIncome = 0,
            };
            await _userRepository.AddUserAsync(user);
            return Ok();
        }
        return BadRequest("Password does not match");
    }
}