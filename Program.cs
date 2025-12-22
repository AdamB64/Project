using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// static files from wwwroot
app.UseStaticFiles();

// serve html
app.MapGet("/", async context =>
{
    await context.Response.SendFileAsync("wwwroot/html/example.html");
});

// simple API endpoint that returns "hello"
app.MapGet("/api/hello", () =>
{
    return Results.Ok("hello");
});

app.Run();
