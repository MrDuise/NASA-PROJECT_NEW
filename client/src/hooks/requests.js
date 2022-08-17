const API_URL = "http://localhost:8000/v1";

// Load planets and return as JSON.
async function httpGetPlanets() {
  const responce = await fetch(`${API_URL}/planets`);
  return await responce.json();
}

// Load launches, sort by flight number, and return as JSON.
async function httpGetLaunches() {
  const responce = await fetch(`${API_URL}/launches`);
  const fetchLaunches = await responce.json();
  return fetchLaunches.sort((a, b) => a.flightNumber - b.flightNumber);
}

// Submit given launch data to launch system.
async function httpSubmitLaunch(launch) {
  try {
    return await fetch(`${API_URL}/launches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(launch),
    });
  } catch (error) {
    return {
      ok: false,
    };
  }
}

// Delete launch with given ID.
async function httpAbortLaunch(id) {
  try {
    return await fetch(`${API_URL}/launches/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    return {
      ok: false,
    };
  }
}

export { httpGetPlanets, httpGetLaunches, httpSubmitLaunch, httpAbortLaunch };