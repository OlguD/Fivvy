

using Fivvy.Api.Helpers;
using Fivvy.Api.Models;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/project")]
public class ProjectController : ControllerBase
{
    private readonly IProjectRepository _projectRepository;
    private readonly JwtHelper _jwtHelper;

    public ProjectController(IProjectRepository projectRepository, JwtHelper jwtHelper)
    {
        _jwtHelper = jwtHelper;
        _projectRepository = projectRepository;
    }


    [HttpGet("all-projects")]
    [Authorize]
    public async Task<IActionResult> GetAllProjects()
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7)
                : authHeader;

            var projects = await _projectRepository.GetAllProjectsAsync(token);
            return Ok(projects);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("add-project")]
    [Authorize]
    public async Task<IActionResult> AddProject([FromForm] AddProjectRequestModel request)
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            if (await _projectRepository.AddProjectAsync(request.Project, token, request.ClientId))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            throw new Exception(ex.Message);
        }
    }


    [HttpPut("update-project/{projectId}")]
    [Authorize]
    public async Task<IActionResult> UpdateProject(int projectId, [FromForm] ProjectModel request)
    {
        try
        {
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            if (await _projectRepository.UpdateProjectAsync(projectId, token, request))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpDelete("remove-project/{projectId}")]
    [Authorize]
    public async Task<IActionResult> RemoveProject(int projectId)
    {
        try
        {

            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

            if (await _projectRepository.DeleteProjectAsync(projectId, token))
            {
                return Ok();
            }
            else
            {
                return BadRequest();
            }
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}