const pomodoroLocalDefault = {"pomodoro": 25, "break": 5, "longbreak": 10, "longbreakmany": 3, "currentSession": 0, "song": "Mudo", "songVolume": 50, "alertWindows": false, "automaticBreak": false};
var currentTestSound;

/* Delay */ 
async function doCountDown(desiredDelay) {
    return new Promise((resolve) => {
        var targetTime = new Date();
        targetTime.setMilliseconds(desiredDelay);

        const intervalId = setInterval(() => {
            var now = new Date();
            if (now >= targetTime) {
                clearInterval(intervalId);
                resolve();
            }
        }, 100);
    });
}

/* Web Notifications */ 
function soundNotification() {
    var alarm = new Howl({
        src: "assets/sounds/" + getValuePomodoro("song") + ".mp3",
        volume: getValuePomodoro("songVolume") / 100
    });

    alarm.play();
}

/* Test Sound */
function soundNotificationTest() {
    if (currentTestSound) currentTestSound.stop();

    songName = document.getElementById("soundConfig").value;
    
    if(songName != "Mudo") {
        var alarm = new Howl({
            src: "assets/sounds/" + songName + ".mp3",
            volume: document.getElementById("volumeConfig").value / 100
        });
    
        alarm.play();
        currentTestSound = alarm;
    }
}

function alertNotification(text) {
    if(!("Notification" in window)) {
        alert("Este browser não suporta notificações de Desktop");
    } else if(Notification.permission === "granted") {
        var notification = new Notification("Pomodoro", {
            icon: "assets/images/icon/icon.png",
            body: text,
        });
    }
}

/* Active Notifications */
function notifyMe() {
    if(!("Notification" in window)) {
        alert("Este browser não suporta notificações de Desktop");
        return false;
    } else if(!(Notification.permission === "granted")) {
        alert("Por favor habilite as notificações!");
        Notification.requestPermission(function (permission) {
            if (permission === "granted") {
                var notification = new Notification("Pomodoro", {
                    icon: "assets/images/icon/icon.png",
                    body: "Notificações Ativadas!",
                });
                return true;
            }
        });
    }
}

/* Change Type Pomodoro Timer */
function chagePomodoro(name) {
    createTimer(getValuePomodoro(name), name);
    document.getElementById(name).checked = true;
}

/* LocalStorage Helper */
function getValuePomodoro(type) {
    localStorageData = JSON.parse(localStorage.getItem("pomodoro"));

    return localStorageData[type];
}

function setValuePomodoro(type, value) {
    localStorageData = JSON.parse(localStorage.getItem("pomodoro"));
    localStorageData[type] = value;

    localStorage.setItem("pomodoro", JSON.stringify(localStorageData));
}

/* Number format always have two digits */
function prependZero(number) {
    if (number <= 9) {
        return "0" + number;
    } else {
        return number;
    }
}

/* Change Page Title */
function setPageTitle(title) {
    document.title = title;
}

/* Change Page Title for Timer */
function setPageTitleTimer(seconds) {
    pageTitle = "Pomodoro";

    minDisplay = Math.floor(seconds / 60);
    secondsDisplay = seconds % 60;

    document.title = "(" + minDisplay + ":" + prependZero(secondsDisplay) + ") " + pageTitle;
}

/* Calculate Distance Between Bars */
function getDistanceBars() {
    ticks = document.getElementsByClassName("tick");
    distance = ticks[1].getBoundingClientRect().x - ticks[0].getBoundingClientRect().x;

    return distance;
}

/* Move Timer For a Position in Percentage */
function moveTimer(percentage) {
    meter = document.getElementById("meter");
    meterData = document.querySelector("#meter .meter-data");

    meterData.style.transform = "translateX(" + (percentage) + "%)";

    min = meter.getAttribute("minutes");
    let secondsRemaining = parseInt(Math.abs(((min * 60) * percentage) / 100));

    setPageTitleTimer(secondsRemaining);
}

/* Start Timer */
async function startTimer() {
    regExp = /\(([^)]+)\)/;
    startPositionMeter = parseFloat(regExp.exec(document.querySelector("#meter .meter-data").style.transform)[1]);

    meter = document.getElementById("meter");

    if(!(startPositionMeter == 0)) {
        if(meter.getAttribute("running") == 0) {
            meter.setAttribute("running", 1);
            meter.setAttribute("paused", 0);

            sessionMap = {"pomodoro": "Pomodoro", "break": "Descanso", "longbreak": "Descanso Longo"};
            session = meter.getAttribute("session");

            alertWindows = getValuePomodoro("alertWindows");
            alertSound = getValuePomodoro("song") == "Mudo" ? false : true;
            automaticBreak = getValuePomodoro("automaticBreak");
            
            percentageValue = (getDistanceBars()*100)/Math.abs(-getDistanceBars() * meter.getAttribute("minutes"));

            while(startPositionMeter < 0) {
                if(meter.getAttribute("paused") == 0) {
                    moveTimer(startPositionMeter)
                    await doCountDown(1000);
                    startPositionMeter += percentageValue / 60;
                } else {
                    break;
                }
            }

            if(meter.getAttribute("paused") == 0) {
                if(session == "pomodoro") setValuePomodoro("currentSession", getValuePomodoro("currentSession") + 1);

                meter.setAttribute("paused", 1);
                meter.setAttribute("running", 0);

                moveTimer(0);

                alertMessage = "Sessão " + sessionMap[session] + " Finalizada!";
                setPageTitle(alertMessage);

                if(alertWindows) alertNotification(alertMessage);

                if(alertSound) soundNotification();

                if(automaticBreak) {
                    await doCountDown(4000);

                    switch(session) {
                        case "pomodoro":
                            if(getValuePomodoro("currentSession") < getValuePomodoro("longbreakmany")) {
                                chagePomodoro("break");
                                startTimer();
                            } else {
                                chagePomodoro("longbreak");
                                startTimer();
                            }
                            break;
                        case "break":
                            chagePomodoro("pomodoro");
                            startTimer();
                            break;
                        default:
                            setValuePomodoro("currentSession", 0);
                            chagePomodoro("pomodoro");
                            startTimer();
                    }
                }
            }
        }
    } else {
        resetTimer();
        startTimer();
    }
}

/* Pause Timer */
function pauseTimer() {
    meter = document.getElementById("meter");

    meter.setAttribute("paused", 1);
    meter.setAttribute("running", 0);
}

/* Reset Timer */
function resetTimer() {
    meter = document.getElementById("meter");
    min = meter.getAttribute("minutes");
    session = meter.getAttribute("session");
    
    createTimer(min, session);
}

/* Create New Timer Based On Minutes */
function createTimer(min, session) {
    meter = document.getElementById("meter");

    meter.setAttribute("minutes", min);
    meter.setAttribute("session", session);
    meter.setAttribute("paused", 1);
    meter.setAttribute("running", 0);

    meterData = document.querySelector("#meter .meter-data");
    meterData.innerHTML = "";

    for(let i = 0; i <= min; i++) {
        let span = document.createElement("span");

        if (i % 5 == 0) {
            span.classList.add("tick", "big");
        } else {
            span.classList.add("tick", "small");
        }

        if(i == min) span.classList.add("end");

        span.setAttribute("value", i);
        meterData.append(span);
    }

    moveTimer(-100);
}

/* Update All Modals Settings Values */
function updateValuesSettings() {
    pomodoro = JSON.parse(localStorage.getItem("pomodoro"));

    document.getElementById("pomodoroConfig").value = pomodoro["pomodoro"];
    document.getElementById("breakConfig").value = pomodoro["break"];
    document.getElementById("longBreakConfig").value = pomodoro["longbreak"];
    document.getElementById("longBreakAfterConfig").value = pomodoro["longbreakmany"];
    document.getElementById("automaticBreakConfig").checked = pomodoro["automaticBreak"];

    document.getElementById("soundConfig").value = pomodoro["song"];
    document.getElementById("volumeConfig").value = pomodoro["songVolume"];
    document.getElementById("notificationWebConfig").checked = pomodoro["alertWindows"];
}

/* Reset Settings Of Timer Modal */
function resetSettingsTimer() {
    document.getElementById("pomodoroConfig").value = pomodoroLocalDefault["pomodoro"];
    document.getElementById("breakConfig").value = pomodoroLocalDefault["break"];
    document.getElementById("longBreakConfig").value = pomodoroLocalDefault["longbreak"];
    document.getElementById("longBreakAfterConfig").value = pomodoroLocalDefault["longbreakmany"];
    document.getElementById("automaticBreakConfig").checked = pomodoroLocalDefault["automaticBreak"];
}

/* Reset Settings Of General Modal */
function resetSettingsGeneral() {
    document.getElementById("soundConfig").value = pomodoroLocalDefault["song"];
    document.getElementById("volumeConfig").value = pomodoroLocalDefault["songVolume"];
    document.getElementById("notificationWebConfig").checked = pomodoroLocalDefault["alertWindows"];
}

/* Automatic Break Config Change State */
function automaticBreakConfigState(state) {
    document.getElementById("longBreakAfterConfig").disabled = !state;
}

/* Called When Page Is Open */
function openPage() {
    pomodoroLocalStorage = JSON.parse(localStorage.getItem("pomodoro"));

    if(pomodoroLocalStorage == null) {
        pomodoroLocalStorage = pomodoroLocalDefault;

        localStorage.setItem("pomodoro", JSON.stringify(pomodoroLocalStorage));
    }

    updateValuesSettings();
    automaticBreakConfigState(pomodoroLocalStorage["automaticBreak"]);

    // Listeners
    document.addEventListener("input", (event) => {
        if(event.target.getAttribute("name") == "options") {
            createTimer(getValuePomodoro(event.target.id), event.target.id);
        }
    });

    const modalTime = document.getElementById('modalTime');
    modalTime.addEventListener('hidden.bs.modal', function (event) {
        updateValuesSettings();
    });

    const modalSettings = document.getElementById('modalConfigurations');
    modalSettings.addEventListener('hidden.bs.modal', function (event) {
        updateValuesSettings();
    });

    const automaticBreakConfig = document.getElementById('automaticBreakConfig')
    automaticBreakConfig.addEventListener('change', (event) => {
        automaticBreakConfigState(event.currentTarget.checked);
    })

    createTimer(pomodoroLocalStorage["pomodoro"], "pomodoro");
}

/* Save Config Of Timer Modal */
function saveTimerConfig() {
    pomodoro = JSON.parse(localStorage.getItem("pomodoro"));
    
    pomodoroValue = parseInt(document.getElementById("pomodoroConfig").value);
    breakValue = parseInt(document.getElementById("breakConfig").value);
    longBreakValue = parseInt(document.getElementById("longBreakConfig").value);
    longBreakAfterValue = parseInt(document.getElementById("longBreakAfterConfig").value);
    automaticBreakValue = document.getElementById("automaticBreakConfig").checked;

    pomodoro["pomodoro"] = pomodoroValue ? pomodoroValue : pomodoroLocalDefault["pomodoro"];
    pomodoro["break"] = breakValue ? breakValue : pomodoroLocalDefault["break"];
    pomodoro["longbreak"] = longBreakValue ? longBreakValue : pomodoroLocalDefault["longbreak"];
    pomodoro["longbreakmany"] = longBreakAfterValue ? ((longBreakAfterValue >= 1) ? longBreakAfterValue : pomodoroLocalDefault["longbreakmany"]) : pomodoroLocalDefault["longbreakmany"];
    pomodoro["automaticBreak"] = automaticBreakValue ? automaticBreakValue : pomodoroLocalDefault["automaticBreak"];

    localStorage.setItem("pomodoro", JSON.stringify(pomodoro));

    updateValuesSettings();

    chagePomodoro("pomodoro");
}

/* Save Config Of General Modal */
function saveGeneralConfig() {
    pomodoro = JSON.parse(localStorage.getItem("pomodoro"));

    soundConfigValue = document.getElementById("soundConfig").value;
    volumeConfigValue = parseInt(document.getElementById("volumeConfig").value);
    notificationWebConfigValue = document.getElementById("notificationWebConfig").checked;

    pomodoro["song"] = soundConfigValue ? soundConfigValue : pomodoroLocalDefault["song"];
    pomodoro["songVolume"] = volumeConfigValue >= 0 ? volumeConfigValue : pomodoroLocalDefault["songVolume"];
    pomodoro["alertWindows"] = notificationWebConfigValue ? notificationWebConfigValue : pomodoroLocalDefault["alertWindows"];

    if(pomodoro["alertWindows"] == true) notifyMe();

    localStorage.setItem("pomodoro", JSON.stringify(pomodoro));
    updateValuesSettings();
}

openPage();