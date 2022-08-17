const {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
} = require('../../models/launches.model');

const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
  const { skip, limit } = getPagination(req.query);

  const launches = await getAllLaunches(skip, limit)
  return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {
  const launch = req.body;

  if (
    !launch.mission ||
    !launch.rocket ||
    !launch.launchDate ||
    !launch.target
  ) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Mission, rocket, launchDate and target are required',
    });
  }
  //format launch date into a date object
  launch.launchDate = new Date(launch.launchDate);
  if (isNaN(launch.launchDate)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid launchDate',
    });
  }

  await scheduleNewLaunch(launch);
  console.log(launch);
  return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
  const id = Number(req.params.id);

  const existsLaunch = await existsLaunchWithId(id);
  if (!existsLaunch) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Launch not found',
    });
  }

  const aborted = await abortLaunchById(id);
  if (!aborted) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Launch could not be aborted',
    });
  }
  return res.status(200).json({
    message: 'Launch aborted',
  });
}

module.exports = { httpGetAllLaunches, httpAddNewLaunch, httpAbortLaunch };
