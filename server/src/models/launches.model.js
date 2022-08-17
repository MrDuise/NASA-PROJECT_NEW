const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const { find } = require('./planets.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches() {
  console.log('Downloading launch data...');
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: 'rocket',
          select: {
            name: 1,
          },
        },
        {
          path: 'payloads',
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log('Problem downloading launch data');
    throw new Error('Launch data downlaod failed');
  }

  const launchDocs = response.data.docs;

  for (const launchDoc of launchDocs) {
    const payloads = launchDoc['payloads'];
    const customers = payloads.flatMap((payload) => {
      return payload['customers'];
    });

    //a launch object that fits the mongodb schema, but its data is being grabbed from the spacex api
    const launch = {
      flightNumber: launchDoc['flight_number'],
      mission: launchDoc['name'],
      rocket: launchDoc['rocket']['name'],
      launchDate: launchDoc['date_local'],
      upcoming: launchDoc['upcoming'],
      success: launchDoc['success'],
      customers: customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchesData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: 'Falcon 1',
    mission: 'FalconSat',
  });

  //check if the hard-coded default first launch is already in the database
  if (firstLaunch) {
    console.log('Launch data already loaded');
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(id) {
  return await findLaunch({ flightNumber: id });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort('-flightNumber');
  return latestLaunch ? latestLaunch.flightNumber : DEFAULT_FLIGHT_NUMBER;
}

async function getAllLaunches(skip, limit) {
  //use skip and limit to implement pagination
  return launchesDatabase
    .find({}, { _id: 0, __v: 0 })
    .sort({ flightNumber: 1 })
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(inputLaunch) {
  try {
    await launchesDatabase.findOneAndUpdate(
      {
        flightNumber: inputLaunch.flightNumber,
      },
      inputLaunch,
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.log(err);
  }
}

async function scheduleNewLaunch(inputLaunch) {
  const planet = await planets.findOne({
    keplerName: inputLaunch.target,
  });
  if (!planet) {
    throw new Error(`Planet ${inputLaunch.target} not found`);
  }
  const newFlightNumber = (await getLatestFlightNumber()) + 1;
  const newLaunch = Object.assign(inputLaunch, {
    success: true,
    upcoming: true,
    customers: ['Zero to Mastery', 'NASA'],
    flightNumber: newFlightNumber,
  });
  await saveLaunch(newLaunch);
}

async function abortLaunchById(id) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: id,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.modifiedCount === 1;
}

module.exports = {
  getAllLaunches,
  scheduleNewLaunch,
  existsLaunchWithId,
  abortLaunchById,
  loadLaunchesData,
};
