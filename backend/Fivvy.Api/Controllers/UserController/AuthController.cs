using Microsoft.AspNetCore.Mvc;
using BCrypt.Net;

using Fivvy.Api.Models;
using Fivvy.Api.Repositories;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Utils;
using Fivvy.Api.Helpers;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly JwtHelper _jwtHelper;
    private readonly IUserRepository _userRepository;

    public AuthController(JwtHelper jwtHelper, IUserRepository userRepository)
    {
        _jwtHelper = jwtHelper;
        _userRepository = userRepository;
    }


    [HttpPost("login")]
    public async Task<IActionResult> UserLoginAsync([FromForm] LoginRequestModel request)
    {
        var user = await _userRepository.GetUserByUsername(request.Username);
        if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            var token = _jwtHelper.GenerateToken(user.Id.ToString(), user.Email);
            return Ok(new { token, user = new { user.Id, user.Email } });
        }
        return Unauthorized("Invalid credentials");
    }

    [HttpPost("register")]
    public async Task<IActionResult> UserRegisterAsync([FromForm] RegisterRequestModel request)
    {
        if (ValidatePassword.validatePassword(request.Password, request.ValidatePassword))
        {
            var user = new UserModel
            {
                Username = request.Username,
                Name = request.Name,
                Surname = request.Surname,
                Email = request.Email,
                Password = request.Password,
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