/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

const Services = require("Services");
const { l10n } = require("../modules/l10n");

const {
  DEBUG_TARGETS,
  PREFERENCES,
  REQUEST_PROCESSES_SUCCESS,
} = require("../constants");

/**
 * This middleware converts tabs object that get from DebuggerClient.listProcesses() to
 * data which is used in DebugTargetItem.
 */
const processComponentDataMiddleware = store => next => action => {
  switch (action.type) {
    case REQUEST_PROCESSES_SUCCESS: {
      const mainProcessComponentData = toMainProcessComponentData(
        action.mainProcess
      );
      action.processes = [mainProcessComponentData];
      break;
    }
  }

  return next(action);
};

function toMainProcessComponentData(process) {
  const type = DEBUG_TARGETS.PROCESS;
  const id = process.processFront.actorID;
  const icon = "chrome://devtools/skin/images/aboutdebugging-process-icon.svg";

  const isMultiProcessToolboxEnabled = Services.prefs.getBoolPref(
    PREFERENCES.FISSION_BROWSER_TOOLBOX,
    false
  );

  const name = isMultiProcessToolboxEnabled
    ? l10n.getString("about-debugging-multiprocess-toolbox-name")
    : l10n.getString("about-debugging-main-process-name");

  const description = isMultiProcessToolboxEnabled
    ? l10n.getString("about-debugging-multiprocess-toolbox-description")
    : l10n.getString("about-debugging-main-process-description2");

  return {
    name,
    icon,
    id,
    type,
    details: {
      description,
      processId: process.id,
    },
  };
}

module.exports = processComponentDataMiddleware;
