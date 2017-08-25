/**
 * Created by harshana on 6/1/17.
 */


var myCalender = angular.module('myCalender', ['mgcrea.ngStrap']);

myCalender.controller('homeController', function ($scope, $timeout, $q, $popover, $http) {
        $scope.MonthNames = ['Area', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $scope.data = [];
        $scope.showContent = false;
        $scope.apiUrl = '/events.php';
        $scope.changes = [];
        $scope.serverData = [];
        $scope.alert = {
            show: false,
            message: '',
            class: 'alert-success'
        };
        // Client ID and API key from the Developer Console
        var CLIENT_ID = '502581757627-t6g279js6onoiaarmqqq3mfhl5ndi9mi.apps.googleusercontent.com';

        // Array of API discovery doc URLs for APIs used by the quickstart
        var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

        var authorizeButton = angular.element('#authorize-button')[0];
        var signoutButton = angular.element('#signout-button')[0];

        function getEventsForCalender(calenderId) {
            return $q(function (resolve, reject) {
                var today = new Date();
                var dt = new Date(Date.UTC(today.getFullYear(), 0, 1, 0, 0, 0, 0));
                var dtEnd = new Date(Date.UTC(today.getFullYear(), 11, 31, 23, 59, 59, 0));
                gapi.client.calendar.events.list({
                    'calendarId': calenderId,
                    'timeMin': dt.toISOString(),
                    'timeMax': dtEnd.toISOString(),
                    'showDeleted': false,
                    'singleEvents': true,
                    /*   'maxResults': 999999,*/
                    'orderBy': 'startTime'
                }).then(function (response) {
                    //var events = response.result.items;
                    resolve(response.result);

                });
            });
        }

        function populateDateForCal(data, month) {
            try {
                var events = [];
                var today = new Date();
                var startDt = new Date(today.getFullYear(), month - 1, 1, 0, 0, 0, 0);
                var endDt = new Date(today.getFullYear(), month, 0, 23, 59, 59, 999);
                var monthEvents = data.filter(function (f) {
                    if (f.start.hasOwnProperty('dateTime')) {
                        return new Date(f.start.dateTime) >= startDt && new Date(f.start.dateTime) <= endDt;
                    }
                    else if (f.start.hasOwnProperty('date')) {
                        return new Date(f.start.date) >= startDt && new Date(f.start.date) <= endDt;
                    } else {
                        return false;
                    }

                });
                if (monthEvents.length == 0) {
                    //add blank one
                    events.push(
                        {
                            name: '',
                            attendees: [],
                            start: undefined,
                            end: undefined,
                            location: '',
                            description: '',
                            widthStyle: {'width': '10%'},
                            organizer: undefined
                        });

                } else {
                    for (var j = 0; j < monthEvents.length; j++) {
                        var event = monthEvents[j];
                        var extraClasses = 'show-item';
                        if (j == 0)
                            extraClasses = 'left-brdr show-item';
                        var startDt = undefined;
                        if (event.start.hasOwnProperty('dateTime')) {
                            startDt = new Date(event.start.dateTime);
                        } else {
                            startDt = new Date(event.start.date);
                        }

                        var endDt = undefined;
                        if (event.end.hasOwnProperty('dateTime')) {
                            endDt = new Date(event.end.dateTime);
                        } else {
                            endDt = new Date(event.end.date);
                        }
                        var colorId = 'color-default';
                        if (event.hasOwnProperty('colorId')) {
                            colorId = 'color-' + event.colorId;
                        }
                        var att = undefined;
                        if (event.hasOwnProperty('attachments')) {
                            att = event.attachments;
                        }
                        events.push(
                            {
                                name: event.summary,
                                attendees: event.attendees,
                                start: startDt,
                                end: endDt,
                                location: event.location,
                                description: event['description'],
                                widthStyle: {'width': (100 / (monthEvents.length )) - 6 + '%'},
                                extraClass: extraClasses,
                                colorId: colorId,
                                id: event.id,
                                attachments: att,
                                organizer: event.hasOwnProperty('organizer') ? event.organizer : undefined
                            });
                    }
                }
                return events;
            }
            catch (e) {
                console.log(e);
            }

        }


        function populateData() {
            $scope.data = [];
            var calIds = [
                'pearson.com_gvkila91d7vgf3pnthuh5dn058@group.calendar.google.com',
                'pearson.com_bbgfdvvqfrunt79b2c4cgh0lt8@group.calendar.google.com',
                'pearson.com_tgvprfn8e0aakbautlu6h6ra90@group.calendar.google.com',
                'pearson.com_b6jl3fraislnke3tfb969ru7ts@group.calendar.google.com',
                'pearson.com_coo567atdfiskutr7iipul84kk@group.calendar.google.com',
                'pearson.com_sten15kc2iqfkithdpojcq104c@group.calendar.google.com',
                'pearson.com_3polpfv3rqttj2tbcqo80km5eg@group.calendar.google.com',
                'pearson.com_h2mll5g9ndpt6qebq8cp5lj0d8@group.calendar.google.com',
                'pearson.com_pplpntouk3nqp7mn2hhjaohla0@group.calendar.google.com',
                'pearson.com_h32e69c9mhc6d0m2u35pelpmu0@group.calendar.google.com',
                'pearson.com_0j4apuh6k44gebq6fn8476eab0@group.calendar.google.com'
            ];

            var apiData = [];

            for (var i = 0; i < calIds.length; i++) {

                getEventsForCalender(calIds[i]).then(
                    function (data) {
                        apiData.push(data);
                    }
                )
            }

            var fillData = function () {


                if (calIds.length === apiData.length) {
                    showChanges(apiData);
                    var genCal = null;
                    for (var i = 0; i < apiData.length; i++) {
                        if (apiData[i].summary.toLowerCase() == 'general') {
                            genCal = apiData[i];
                            apiData.splice(i, 1);
                            break;
                        }
                    }
                    apiData = apiData.sort(function (a, b) {
                        if (a.summary.toLowerCase() < b.summary.toLowerCase()) {
                            return -1;
                        }
                        else if (a.summary.toLowerCase() > b.summary.toLowerCase()) {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                    apiData.push(genCal);

                    for (var i = 0; i < 13; i++) {
                        var monthData = {
                            name: $scope.MonthNames[i],
                            no: i,
                            calenders: []
                        };
                        for (var j = 0; j < apiData.length; j++) {
                            var api = apiData[j];
                            if (i === 0) {
                                monthData.calenders.push({
                                    name: api.summary,
                                    events: [],
                                    showName: api.summary,
                                    title: api.description,
                                    id: api.etag
                                });

                            } else {

                                var events = populateDateForCal(api.items, i);
                                monthData.calenders.push({
                                    name: api.summary,
                                    events: events,
                                    id: api.etag + '-' + i
                                });
                            }
                        }

                        $scope.data.push(monthData)
                    }
                    $scope.showContent = true;
                } else {
                    console.log('fildata waiting 600');
                    $timeout(fillData, 600);
                }
            };
            fillData();
        }

        /**
         * Deep compare of two objects.
         *
         * Note that this does not detect cyclical objects as it should.
         * Need to implement that when this is used in a more general case. It's currently only used
         * in a place that guarantees no cyclical structures.
         *
         * @param {*} x
         * @param {*} y
         * @return {Boolean} Whether the two objects are equivalent, that is,
         *         every property in x is equal to every property in y recursively. Primitives
         *         must be strictly equal, that is "1" and 1, null an undefined and similar objects
         *         are considered different
         */
        function equals(x, y) {
            // If both x and y are null or undefined and exactly the same
            if (x === y) {
                return true;
            }

            // If they are not strictly equal, they both need to be Objects
            if (!( x instanceof Object ) || !( y instanceof Object )) {
                return false;
            }

            // They must have the exact same prototype chain, the closest we can do is
            // test the constructor.
            if (x.constructor !== y.constructor) {
                return false;
            }

            for (var p in x) {
                // Inherited properties were tested using x.constructor === y.constructor
                if (x.hasOwnProperty(p)) {
                    // Allows comparing x[ p ] and y[ p ] when set to undefined
                    if (!y.hasOwnProperty(p)) {
                        return false;
                    }

                    // If they have the same strict value or identity then they are equal
                    if (x[p] === y[p]) {
                        continue;
                    }

                    // Numbers, Strings, Functions, Booleans must be strictly equal
                    if (typeof( x[p] ) !== "object") {
                        return false;
                    }

                    // Objects and Arrays must be tested recursively
                    if (!equals(x[p], y[p])) {
                        return false;
                    }
                }
            }

            for (p in y) {
                // allows x[ p ] to be set to undefined
                if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) {
                    return false;
                }
            }
            return true;
        }

        function showChanges(apiData) {
            //get last saved
            $http({
                method: 'GET',
                url: $scope.apiUrl + '?id_token=' + gapi.client.getToken().id_token
            }).then(function successCallback(response) {
                // this callback will be called asynchronously
                // when the response is available
                var sData = JSON.parse(response.data);
                $scope.serverData = sData;
                var latestData = apiData.map(function (a) {
                    return {
                        etag: a.etag,
                        summary: a.summary,
                        items: a.items.map(function (f) {
                                return {
                                    id: f.id,
                                    start: f.start,
                                    end: f.end,
                                    summary: f.summary
                                }
                            }
                        )
                    }
                });
                $scope.latestData = latestData;
                for (var i = 0; i < apiData.length; i++) {
                    if (!equals(sData[i], latestData[i])) {
                        //added items
                        var A = sData[i].items.map(function (a) {
                            return a.id
                        });
                        var B = latestData[i].items.map(function (a) {
                            return a.id
                        });

                        var removed = A.filter(function (x) {
                            return B.indexOf(x) < 0
                        });
                        var added = B.filter(function (x) {
                            return A.indexOf(x) < 0
                        });

                        var changed = [];
                        //changed
                        for (var j = 0; j < latestData[i].items.length; j++) {
                            var a = latestData[i].items[j];
                            if (added.includes(a.id)) {
                                continue; //new item
                            }
                            var oldItem = sData[i].items.find(function (x) {
                                return x.id === a.id
                            });
                            if (a.summary !== oldItem.summary || !equals(a.start, oldItem.start) || !equals(a.end, oldItem.end)) {
                                changed.push({
                                    pre: oldItem,
                                    new: a
                                })
                            }
                        }
                        if (removed.length > 0 || added.length > 0 || changed.length > 0) {
                            $scope.changes.push({
                                etag: sData[i].etag,
                                show: false,
                                summary: sData[i].summary,
                                added: latestData[i].items.filter(function (x) {
                                    return added.includes(x.id)
                                }),
                                removed: sData[i].items.filter(function (x) {
                                    return removed.includes(x.id)
                                }),
                                changed: changed
                            });
                        }
                    }
                }
                if ($scope.changes.length > 0) {
                    $scope.changes[0].show = true;
                }

            }, function errorCallback(response) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
            });
            //
        }

        /**
         *  Called when the signed in status changes, to update the UI
         *  appropriately. After a sign-in, the API is called.
         */
        $scope.updateSigninStatus = function (isSignedIn) {
            if (isSignedIn) {
                authorizeButton.style.display = 'none';
                //  signoutButton.style.display = 'block';
                populateData();
            } else {
                authorizeButton.style.display = 'block';
                //signoutButton.style.display = 'none';
            }
        };

        /**
         *  Initializes the API client library and sets up sign-in state
         *  listeners.
         */
        $scope.initClient = function () {

            gapi.client.init({
                discoveryDocs: DISCOVERY_DOCS,
                clientId: CLIENT_ID,
                scope: SCOPES
            }).then(function () {
                // Listen for sign-in state changes.
                gapi.auth2.getAuthInstance().isSignedIn.listen($scope.updateSigninStatus);

                // Handle the initial sign-in state.
                $scope.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            });
        };

        /**
         *  On load, called to load the auth2 library and API client library.
         */
        $scope.init = function () {
            var countUp = function () {
                if (typeof gapi !== 'undefined') {
                    gapi.load('client:auth2', $scope.initClient);
                } else {
                    console.log('checking again in 1 sec!');
                    $timeout(countUp, 1000);
                }
            };
            countUp();
        };

        /**
         *  Sign in the user upon button click.
         */
        $scope.btnAuthorize_click = function () {
            gapi.auth2.getAuthInstance().signIn();
        };
        /**
         *  Sign out the user upon button click.
         */
        $scope.btnSignOut_click = function () {
            gapi.auth2.getAuthInstance().signOut();
            $scope.showContent = false;
        };
        $scope.myPopover = {};

        $scope.calenderItem_click = function ($event, calender, event) {
            if (event === null) {
                var p = angular.element($event.currentTarget.parentNode.parentNode);

                if (!$scope.myPopover['_G_' + p.attr('id')]) {

                    var myPopover = $popover(
                        angular.element(p),
                        {
                            trigger: 'click',
                            autoClose: true,
                            placement: 'bottom',
                            content: calender,
                            templateUrl: 'popover-a.html'
                        }
                    );
                    $scope.myPopover['_G_' + p.attr('id')] = myPopover;
                    $timeout(function () {
                        $event.target.click();
                    }, 500);
                }
            } else {
                if (!$scope.myPopover[calender.$$hashKey + event.id]) {
                    if (event.attendees && event.attendees.length > 0) {
                        event.attendeesList = event.attendees.map(function (val) {
                            return val.displayName || val.email;
                        }).join(', ');
                    }
                    var myPopover = $popover(
                        angular.element($event.currentTarget),
                        {
                            trigger: 'click',
                            autoClose: true,
                            placement: 'bottom',
                            content: event,
                            templateUrl: 'popover.html'
                        }
                    );
                    $scope.myPopover[calender.$$hashKey + event.id] = myPopover;
                    $timeout(function () {
                        $event.target.click();
                    }, 500);
                }

            }

        };

        function showAlert(message, className) {
            $scope.alert.message = message;
            $scope.alert.show = true;
            $scope.alert.class = className;
            $timeout(function () {
                $scope.alert.show = false
            }, 5000);
        }

        $scope.btnAccept_click = function (cal) {
            console.log(cal);
            //$scope.latestData
            var changed = $scope.latestData.find(function (a) {
                return a.etag = cal.etag;
            });
            for (var j = 0; j < $scope.serverData.length; j++) {
                if ($scope.serverData[j].etag == cal.etag) {
                    $scope.serverData[j].items = changed.items;
                    break;
                }
            }
            //save changes
            $http({
                method: 'POST',
                url: $scope.apiUrl + '?id_token=' + gapi.client.getToken().id_token,
                headers: {
                    'Content-Type': 'application/json'
                },
                data: $scope.serverData
            }).then(
                function successCallback(response) {
                    showAlert('Accept saved successfully.', 'alert-success');
                    for (var j = 0; j < $scope.changes.length; j++) {
                        if ($scope.changes[j].etag == cal.etag) {
                            $scope.changes.splice(j, 1);
                            break;
                        }
                    }
                },
                function errorCallback(response) {
                    showAlert('Error occurred while saving.', 'alert-danger');
                    console.log(response);
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                });
        };


        $scope.init();

    }
)
;
myCalender.filter('dateformat', function ($filter) {
    return function (input) {
        if (input.hasOwnProperty('date')) {
            var date = new Date(input.date);
            return ($filter('date')(date, 'MMM d, y') );
        }
        if (input.hasOwnProperty('dateTime')) {
            var date = new Date(input.dateTime);
            return ($filter('date')(date, 'medium') );
        }
    }
});
myCalender.directive('moreButton', function () {
    return {
        restrict: 'E',
        scope: {
            evnt: '='
        },
        controller: function ($scope, $popover, $timeout, $rootScope) {

            $scope.btnId = 'btn_' + Math.random().toString().replace('.', '_');

            $scope.togglePopover = function ($event) {
                $rootScope.$broadcast('ItemClicked');
                if ($scope.myPopover) {

                } else {
                    if ($scope.evnt.attendees && $scope.evnt.attendees.length > 0) {
                        $scope.evnt.attendeesList = $scope.evnt.attendees.map(function (val) {
                            return val.displayName || val.email;
                        }).join(', ');
                    }
                    $scope.myPopover = $popover(
                        angular.element('#' + $scope.btnId),
                        {
                            trigger: 'click',
                            autoClose: true,
                            placement: 'bottom',
                            content: $scope.evnt,
                            templateUrl: 'popover.html'
                        }
                    );
                    $timeout(function () {
                        $event.target.click();
                    }, 500);
                }
            };
            $scope.$on('ItemClicked', function (event) {
                if ($scope.myPopover) {
                    $scope.myPopover.hide();
                }
            });
            $scope.init = function () {

            };
        },
        template: ' <button id="{{btnId}}" class="btn btn-success" ng-click="togglePopover($event)">Show</button>'
    }
});