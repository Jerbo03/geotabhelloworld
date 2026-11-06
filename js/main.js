geotab.addin.helloWorld = function () {

    let api;
    let state;

    return {
        initialize: function (apiObject, stateObject, callback) {

            api = apiObject;
            state = stateObject;

            console.log("Hello Geotab: Initialize");

            callback();
        },

        focus: function (apiObject, stateObject) {

            api = apiObject;
            state = stateObject;

            document.getElementById("status").textContent =
                "Add-In conectado a MyGeotab.";

            console.log("Hello Geotab: Focus");
        },

        blur: function () {

            console.log("Hello Geotab: Blur");
        }
    };
};

document.addEventListener("DOMContentLoaded", function () {

    document.getElementById("testButton").addEventListener("click", function () {
        alert("Hello from Geotab!");
    });

});