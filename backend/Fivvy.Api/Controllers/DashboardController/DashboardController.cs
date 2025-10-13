

using Fivvy.Api.Repositories;
using Fivvy.Api.Utils;
using Fivvy.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashBoardController : ControllerBase
{
    private readonly IDashboardRepository _dashboardRepository;

    public DashBoardController(IDashboardRepository dashboardRepository)
    {
        _dashboardRepository = dashboardRepository;
    }

    [HttpGet("overview")]
    public async Task<IActionResult> Overview([FromQuery] DashboardOverviewRequest request)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Missing bearer token");
        }

        try
        {
            var result = await _dashboardRepository.OverviewAsync(token);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

    [HttpGet("activities")]
    public async Task<IActionResult> Activities([FromQuery] DashboardActivitiesRequest request)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Missing bearer token");
        }

        try
        {
            var result = await _dashboardRepository.GetActivitiesAsync(token, request.Page, request.PageSize);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
    }

}