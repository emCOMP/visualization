function Option(args) {    
    Object.keys(args).map(function(item) {
        this[item] = args[item];
    }, this);
    
    this.cur = this.ids[this.default];
};
Option.prototype = {
    get: function() { return this.cur; },
    getLabel: function() { return this.labels[this.indexCur()]; },
    set: function(choice) {
        if(this.has(choice))
            this.cur = choice;
    },
    is: function(choice) { return this.cur == choice; },
    has: function(choice) {
        return this.custom_entries_allowed || this.indexOf(choice) > -1;
    },
    indexOf: function(choice) { return this.ids.indexOf(choice); },
    indexCur: function() { return this.indexOf(this.cur); }
};

function Options() {
    var self = this;
    
    var options = {};
    options.topmenu = ['collection', 'time_limit', 'add_term', '<br>',
                    'series', 'subset', 'found_in', 'resolution', '<br>',
                    'display_type', 'shape', 'color_scale', 'y_scale', 'y_max', 'context_line']; 
    
//    if (window.location.href.indexOf('index_dev.html') > -1) {
//        options.dropdowns.push('series');
//    }
    options.timefields = ['time_min', 'time_max']; 
    
    options.record = ['collection', 'subset', 'resolution', 'time_limit',
                      'display_type', 'y_scale', 'shape', 'series',
                      'time_save', 'time_min', 'time_max',
                      'y_max_toggle', 'y_max', 'color_scale',
                      'context_line', 'found_in'];//,
//                      'terms_selected'];
    
    options.collection = new Option({
            title: "Collection",
            labels: ["none"],
            ids:    ["none"],
            available: [0],
            default: 0,
            callback: function() {
                options.terms_selected.set("");
                loadCollectionData(); }
        });
    options.display_type = new Option({
            title: "Plot Type",
            labels: ["Stacked", "Overlap", "Lines", "Stream", "Separate", "100%"],
            ids:    ["stacked", "overlap", "lines", "stream", "separate", "percent"],
            available: [0, 1, 2, 3, 4, 5],
            default: 0,
            callback: function() { display(); }
        });
    options.resolution = new Option({
            title: "Resolution",
            labels: ["Day", "Hour", "10 Minutes", "Minute"],
            ids:    ["day", "hour", "tenminute", "minute"],
            available: [0, 1, 2, 3],
            default: 2,
            callback: function() { prepareData(); }
        });
    options.subset = new Option({
            title: "Subset",
            labels: ["All", "Distinct", "Original", "Retweet", "Reply", "Quote"],
            ids:    ["all", "distinct", "original", "retweet", "reply", "quote"],
            available: [0, 1, 2, 3, 4, 5],
            default: 0,
            callback: function() { changeData(); }
        });
    options.shape = new Option({
            title: "Shape",
            labels: ["Linear",  "Basis",        "Step"],
            ids:    ["linear",  "basis-open",   "step-after"],
            available: [0, 1, 2],
            default: 2,
            callback: function() { prepareData(); }
        });
    options.series = new Option({
            title: "Series",
            labels: ["None", "Terms", "Tweet Types", "Distinct/Not"],
            ids:    ["none", "terms", "types", "distinct"],
            available: [0, 1, 2, 3],
            default: 1,
            callback: function() { changeSeries('all'); }
        });
    options.y_scale = new Option({
            title: "Y Scale",
            labels: ["Linear",  "Power", "Log", "Preserve"],
            ids:    ["linear",  "pow",   "log", "preserve"],
            available: [0, 1, 2],
            default: 0,
            callback: function() { display(); }
        });
    options.y_max = new Option({
            title: "Y Max",
            labels: [0],
            ids:    [0],
            available: [0],
            default: 0,
            type: "textfieldautoman",
            custom_entries_allowed: true,
            callback: function() { display(); }
        });
    options.time_save = new Option({
            title: "Save Time State",
            styles: ["btn btn-default", "btn btn-primary"],
            labels: ["<span class='glyphicon glyphicon-ban-circle'></span> Saving", "<span class='glyphicon glyphicon-ok-circle'></span> Saving"],
            ids:    ["false", "true"],
            available: [0, 1],
            default: 0,
            type: "toggle",
            callback: function() { 
                var saving = !(options.time_save.is("true"));
                if(saving) {
                    if(options.record.indexOf('time_min') == -1)
                        options.record.push('time_min');
                    if(options.record.indexOf('time_max') == -1)
                        options.record.push('time_max');
                } else {
                    if(options.record.indexOf('time_min') > -1)
                        options.record.splice(options.record.indexOf('time_min'), 1);
                    if(options.record.indexOf('time_max')>  -1)
                        options.record.splice(options.record.indexOf('time_max'), 1);
                }
            }
        });
    options.time_min = new Option({
            title: "Begin",
            labels: ["2000-01-01 00:00"],
            ids:    [new Date("2000-01-01 00:00")],
            available: [0],
            default: 0,
            custom_entries_allowed: true,
            callback: function() { setFocusTime('input_field'); }
        });
    options.time_max = new Option({
            title: "End",
            labels: ["2000-01-01 00:00"],
            ids:    [new Date("2000-01-01 00:00")],
            available: [0],
            default: 0,
            custom_entries_allowed: true,
            callback: function() { setFocusTime('input_field'); }
        });
    options.time_limit = new Option({
            title: "Tweets in",
            labels: ["First 3 Hours", "First 12 Hours", "First 24 Hours", "First 3 Days", "First Week", "All time", "Latest Week", "Latest 3 Days", "Latest 24 Hours", "Latest 12 Hours", "Latest 3 Hours"],
            ids:    ["3h", "12h", "1d", "3d", '1w', 'all', '-1w', '-3d', '-1d', '-12h', '-3h'],
            available: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            default: 2,
            callback: function() { loadCollectionData(); }
        });
    options.plot_click = new Option({
            title: "On Plot Click",
            labels: ["Deselect", "Get Tweets"],
            ids:    ["deselect", "gettweets"],
            available: [0, 1],
            default: 0,
            callback: function() { console.log("Changed plot click"); }
        });
    options.add_term = new Option({
            title: "Add Term",
            labels: ["New Term"],
            ids:    ["new"],
            available: [0],
            default: 0,
            custom_entries_allowed: true,   
            type: "textfieldconfirm",
            callback: function() { genEventTweetCount(); }
        });
    options.color_scale = new Option({
            title: "Color Scale",
            labels: ["10", "20", "20b", "20c"],
            ids:    ["category10", 'category20', 'category20b', 'category20c'],
            available: [0, 1, 2, 3],
            default: 1,
            callback: function() { prepareData(); }
        });
    options.terms_selected = new Option({
            title: "Terms Selected",
            labels: [""],
            ids:    [''],
            available: [0],
            default: 0,
            custom_entries_allowed: true, 
            callback: function() { prepareData(); }
        });
    options.context_line = new Option({
            title: "Show total",
            styles: ["btn btn-default", "btn btn-primary"],
            labels: ["<span class='glyphicon glyphicon-ban-circle'></span> Show Total Line", "<span class='glyphicon glyphicon-ok-circle'></span> Show Total Line"],
            ids:    ["false", "true"],
            available: [0, 1],
            default: 1,
            type: "toggle",
            callback: function() { display(); }
        });
    options.found_in = new Option({
            title: "Terms Found In",
            labels: ["Any", "Text", "Quote", "URL"],
            ids:    ["Any", "Text", "Quote", "URL"],
            available: [0, 1, 2, 3],
            default: 1,
            callback: function() { changeData(); }
        });
    
    // push holder variables and option sets into the list
    this.state = {};
    Object.keys(options).map(function(item) {
        this[item] = options[item];
    }, this);
};

Options.prototype = {
    init: function() {
        var options = this;
        
        // Build options
        options.buildTopMenu(options);
        options.buildTimeWindow(options);
        
        // Import the current state
        options.importState(options);
        window.onpopstate = function() {
            options.importState(options)
        };
        
        //
        options.y_max_toggle.styleFunc();
        options.time_save.styleFunc();
        options.context_line.styleFunc();
        $(function () {
            $('[data-toggle="popover"]').popover()
        })
        
        // Record the state
        options.recordState(options, null, false);
    },
    importState: function(options) {
        var state;
        try {
//            state = JSON.parse(window.location.hash.slice(1));
//            console.debug(state);
            var strstate = window.location.hash.slice(2);
            if(strstate.length <= 0)
                return;
            var arrstate = strstate.split('&');
            state = arrstate.reduce(function(s, d) {
                var kv = d.split('=');
                s[kv[0]] = kv[1].slice(1, kv[1].length -1);
                return s;
            }, {});
        } catch(err) {
            return;
        }
        
        // Figure out what options should be different
        var changed = [];
        Object.keys(state).map(function(option) {
            var value = state[option];
            if(["time_min", "time_max"].indexOf(option) > -1) {
                if(options.time_save.is("false"))
                    return;
                
                value = new Date(value);
            }
            
            if(option in options && !options[option].is(value)) {
                // Record this change
                console.info("Import option " + option + 
                            ": from [" + options[option].get() + "]" +
                            " to [" + value + "]");
                changed.push(option);
                
                // Change the state entry
                options[option].set(value);
                options.state[option] = value;
                
                // Change the interface
                if(options.topmenu.indexOf(option) > -1) {
                    if(options[option].textfield) {
                        options[option].update(value);
                    } else {
                        d3.select("#choose_" + option).select('.current')
                            .text(options[option].getLabel());
                    }
                }
            }
        });
        
        // If the program has been initialized
        if(changed.length > 0 && data_raw != undefined) {
            // Render changes
            // Right now this function is VERY manual, should make a more explicit data flow

            if(changed.indexOf("collection") > -1)
                options.collection.callback();
            else
                options.subset.callback();
        }
    },
    recordState: function(options, changedItem, newState) {
        if(changedItem == undefined) {
            options.state = options.record.reduce(function(state, dropdown) {
                state[dropdown] = options[dropdown].get();
                return state;
            }, {});
        } else {
            options.state[changedItem] = options[changedItem].get();
        }

//        strstate = '#' + JSON.stringify(this.state);
        arrstate = Object.keys(options.state).map(function(d) {
                return d + '="' + options.state[d] + '"';
            });
        strstate = '#!' + arrstate.join('&');
        
        if(newState == undefined || newState) {
            history.pushState(null, null, strstate);
        } else {
            history.replaceState(null, null, strstate);
        }
    },
    buildButtonSet: function(option) {
        if(option == '<br>') {
            d3.select("#choices").append("br")
            return
        }
        
        var set = this[option];
        
        var container = d3.select("#choices").append("div")
            .attr("class", "choice")
            .style("text-transform", "capitalize")
            .html(" " + set.title + ": ")
            .append("div")
                .attr("id", superId)
                .attr("class", "btn-group");
        
//        container.append("button")
//            .attr({type: "button",
//                class: 'btn btn-default'})
//            .style({'font-weight': 'bold'})
//            .text(set.title);
        
        container.selectAll("button")
            .data(set.available)
            .enter()
            .append("button")
                .attr("type", "button")
                .attr("class", "btn btn-default")
                .attr("id", function(d) { return set.ids[d]; })
                .text(function(d) { return set.labels[d]; })
                .on("click", function(d) {
                    container.select('.active').classed('active', false);
                    container.select('#' + set.ids[d]).classed('active', true);

                    set.set(set.ids[d]);

                    set.callback();
                });

        container.select('#' + set.ids[set.default]).classed('active', true);
    },
    buildTopMenu: function(options) {
        options.topmenu.map(function(option) {
            if (option == '<br>') {
                d3.select("#choices").append("br")
            } else if(options[option].type == 'textfieldautoman') {
                options.buildTextToggle(options, option);
            } else if(options[option].type == 'textfieldconfirm') {
                options.buildTextConfirm(options, option);
            } else if(options[option].type == 'toggle') {
                options.buildToggle(options, option);
            } else { // Dropdown
                options.buildDropdown(options, option);
            }
        });
    },
    buildToggle: function(options, option) {
        var set = options[option];
        
        var superId = "choose_" + option;
        set.styleFunc = function() {
            d3.select('#' + superId + "_button")
                .attr('class', function() {
                    return set.styles[set.indexCur()];
                })
                .html(function() {
                    return set.getLabel();
                });
        }
        
        // Make container
        var container = d3.select("#choices").append("div")
            .attr("class", "choice")
            .style("display", "inline-table")
            .style("vertical-align", "top")
            .style("text-transform", "capitalize")
            .append("div")
                .attr("id", superId)
                .attr("class", "input-group");
        
        container.append('button')
            .attr('id', superId + "_button")
            .on('click', function(d) {
                var toggle = !(set.get() == "true");
                set.set(toggle ? "true" : "false");
                set.styleFunc();
                options.recordState(options, option);
            
                set.callback();
            });
    },
    buildTextToggle: function(options, option) {
        var set = options[option];
        
        // Make container
        var superId = "choose_" + option;
        var container = d3.select("#choices").append("div")
            .attr("class", "choice")
            .style("display", "inline-table")
            .style("vertical-align", "top")
            .style("text-transform", "capitalize")
            .append("div")
                .attr("id", superId)
                .attr("class", "input-group");
        
        // Add title
        container.append('span')
            .attr('class', 'input-group-addon')
            .html(set.title);
        
        // Add toggle option
        var toggleOption = option + "_toggle";
        
        options[toggleOption] = new Option({
            title: "Save " + set.title + " State",
            styles: ["btn btn-default", "btn btn-primary"],
            labels: ["Auto", "Manual"],
//            labels: ["<span class='glyphicon glyphicon-pencil'></span>", "<span class='glyphicon glyphicon-pencil'></span>"],
            tooltips: ["Click to toggle manual mode", "Click to toggle automatic mode"],
//            labels: [set.title, set.title],
//            labels: ["<span class='glyphicon glyphicon-ban-circle'></span> Auto", "<span class='glyphicon glyphicon-ok-circle'></span> Manual"],
            ids:    ["false", "true"],
            available: [0, 1],
            default: 0,
            callback: function() {
                options.recordState(options);
                display();
            },
            styleFunc: function() {
                d3.select('#input_' + option)
                    .attr('disabled', options[toggleOption].get() == "true" ? null : true);
                d3.select('#choice_' + toggleOption)
                    .attr('class', function() {
                        return options[toggleOption].styles[options[toggleOption].indexCur()];
                    })
                    .attr('data-content', function() {
                        return options[toggleOption].tooltips[options[toggleOption].indexCur()];
                    })
                    .html(function() {
                        return options[toggleOption].getLabel();
                    });
            }
        });
        
        container.append("input")
            .attr("id", "input_" + option)
            .style("width", "80px")
            .attr("class", "text-center form-control")
            .on('keyup', function(d) {
                set.set(this.value);
                options.recordState(options, option);
            
                options[option].callback();
            });
        
        container.append('div')
            .attr('class', 'input-group-btn')
            .append('button')
            .attr({
                id: 'choice_' + toggleOption,
                'data-toggle': "popover",
                'data-trigger': "hover",
                'data-placement': "bottom",
                'data-content': "Tooltip on bottom"
            })
            .on('click', function(d) {
                var saving = !(options[toggleOption].get() == "true");
                options[toggleOption].set(saving ? "true" : "false");
                options[toggleOption].styleFunc();
            
                if(saving) {
                    if(options.record.indexOf(option) == -1)
                        options.record.push(option);
                } else {
                    if(options.record.indexOf(option) > -1)
                        options.record.splice(options.record.indexOf(option), 1);
                }
            
                options[toggleOption].callback();
            });
        
        options[option].update = function(value) {
            document.getElementById("input_" + option)
                .value = value;
        };
        

        options.state[toggleOption] = options[toggleOption].get();
        options.state[option] = set.ids[set.default];
    },
    buildTextConfirm: function(options, option) {
        var set = options[option];
        
        // Make container
        var superId = "choose_" + option;
        var container = d3.select("#choices").append("div")
            .attr("class", "choice")
            .style("display", "inline-table")
            .style("vertical-align", "top")
            .style("text-transform", "capitalize")
            .append("div")
                .attr("id", superId)
                .attr("class", "input-group");
        
        // Add title
        container.append('span')
            .attr('class', 'input-group-addon')
            .html(set.title);
        
        container.append("input")
            .attr("id", "input_" + option)
            .style("width", "120px")
            .attr("class", "text-center form-control")
            .html(set.labels[set.default])
            .on('keyup', function(d) {
                if (d3.event.keyCode == 13) {
                    options[option].callback();
                } else {
                    set.set(this.value);
                }
            });
        
        options[option].reset = function(value) {
            set.set("");
            document.getElementById("input_" + option)
                .value = "";
        };
        
        container.append('div')
            .attr('class', 'input-group-btn')
            .append('button')
            .html("<span class='glyphicon glyphicon-search'></span>")
            .attr('class', 'btn btn-primary')
            .on('click', options[option].callback);
        
        options.state[option] = set.ids[set.default];
    },
    buildDropdown: function(options, option) {
        var set = options[option];

        var superId = "choose_" + option;
        var container = d3.select("#choices").append("div")
            .attr("class", "choice")
            .style("text-transform", "capitalize")
            .append("div")
                .attr("id", superId)
                .attr("class", "dropdown");
        
        container.append("button")
            .attr({type: "button",
                class: 'btn btn-primary dropdown-toggle',
                'data-toggle': "dropdown",
                'aria-haspopup': true,
                'aria-expanded': false})
            .html("<strong>" + set.title + ":</strong> ");
        
        container.select('button').append('span')
            .attr('class', 'current')
            .style('text-transform', 'capitalize')
            .html('Label');

        container.select('button').append('text')
            .text(' ');
        container.select('button').append('span')
            .attr('class', 'caret');

        container.append('ul')
            .attr({class: 'dropdown-menu'})
            .selectAll("li")
                .data(set.available)
                .enter()
                .append("li").append("a")
                    .attr("id", function(d) { return option + "_" + set.ids[d]; })
                    .html(function(d) {
                        return set.labels[d];
                    })
                    .on("click", function(d) {
                        container.select('.current')
                            .text(set.labels[d]);
                        
                        set.set(set.ids[d]);
                        options.recordState(options, option);

                        set.callback();
                    });

        // Save the current value to the interface and the history
        container.select('.current')
            .text(set.labels[set.default]);
        
        options.state[option] = set.ids[set.default];
    },
    buildTimeWindow: function(options) {
 
        var container = d3.select("#chart-bottom").append("div")
            .style({width: '500px', display: 'inline-table'})
            .attr("class", "text-center input-group");
//            .html("<strong>Time Window:</strong> ");
        
        
        var right_buttons = container.append('div')
            .attr('class', 'input-group-btn');
        
        right_buttons.append('button')
            .attr({class: 'btn btn-default'})
            .html('<span class="glyphicon glyphicon-step-backward"></span>')
            .on('click', function(d) {
                setFocusTime('button_time_to_start');
            });
//        right_buttons.append('button')
//            .attr({class: 'btn btn-default'})
//            .html('<span class="glyphicon glyphicon-backward"></span>')
//            .on('click', function(d) {
//                setFocusTime('button_time_minus_6h');
//            });
//        right_buttons.append('button')
//            .attr({class: 'btn btn-default'})
//            .html('<span class="glyphicon glyphicon-triangle-left"></span>')
//            .on('click', function(d) {
//                setFocusTime('button_time_minus_1h');
//            });
        
        container.append("input")
//            .style('width', '140px') // add 40 px for timezones
            .attr("id", "choose_time_min")
            .attr("class", "text-center form-control");
        container.append("span")
            .attr("class", "input-group-addon")
            .text("  to  ");
        container.append("input")
//            .style('width', '140px')
            .attr("id", "choose_time_max")
            .attr("class", "text-center form-control");
        
        var left_buttons = container.append('div')
            .attr('class', 'input-group-btn');
        
//        left_buttons.append('button')
//            .attr({class: 'btn btn-default'})
//            .html('<span class="glyphicon glyphicon-triangle-right"></span>')
//            .on('click', function(d) {
//                setFocusTime('button_time_plus_1h');
//            });
//        left_buttons.append('button')
//            .attr({class: 'btn btn-default'})
//            .html('<span class="glyphicon glyphicon-forward"></span>')
//            .on('click', function(d) {
//                setFocusTime('button_time_plus_6h');
//            });
        left_buttons.append('button')
            .attr({class: 'btn btn-default'})
            .html('<span class="glyphicon glyphicon-step-forward"></span>')
            .on('click', function(d) {
                setFocusTime('button_time_to_end');
            });
        
        options.time_save.styleFunc = function() {
            d3.select('#choice_time_save')
                .attr('class', function() {
                    return options.time_save.styles[options.time_save.indexCur()];
                })
                .html(function() {
                    return options.time_save.getLabel();
                });
        }
        
        left_buttons.append('button')
            .attr('id', 'choice_time_save')
            .on('click', function(d) {
                var saving = !(options.time_save.is("true"));
                options.time_save.set(saving ? "true" : "false");
                options.time_save.styleFunc();
                options.recordState(options);
            
                options.time_save.callback();
            });
 
        var startDateTextBox = $('#choose_time_min');
        var endDateTextBox = $('#choose_time_max');
        
        startDateTextBox.datetimepicker({ 
            dateFormat: 'yy-mm-dd',
            timeFormat: 'HH:mm', // HH:mm z for timezone
            onClose: function(dateText, inst) {
                if (endDateTextBox.val() != '') {
                    var testStartDate = startDateTextBox.datetimepicker('getDate');
                    var testEndDate = endDateTextBox.datetimepicker('getDate');
                    if (testStartDate > testEndDate)
                        endDateTextBox.datetimepicker('setDate', testStartDate);
                } else {
                    endDateTextBox.val(dateText);
                }
            },
            onSelect: function (selectedDateTime){
                var date = startDateTextBox.datetimepicker('getDate');
                endDateTextBox.datetimepicker('option', 'minDate', date);
                options.time_min.set(date);
                
                options.time_min.callback();
            }
        });
        endDateTextBox.datetimepicker({
            dateFormat: 'yy-mm-dd',
            timeFormat: 'HH:mm',
            onClose: function(dateText, inst) {
                if (startDateTextBox.val() != '') {
                    var testStartDate = startDateTextBox.datetimepicker('getDate');
                    var testEndDate = endDateTextBox.datetimepicker('getDate');
                    if (testStartDate > testEndDate)
                        startDateTextBox.datetimepicker('setDate', testEndDate);
                } else {
                    startDateTextBox.val(dateText);
                }
            },
            onSelect: function (selectedDateTime){
                var date = endDateTextBox.datetimepicker('getDate');
                endDateTextBox.datetimepicker('option', 'maxDate', date);
                options.time_max.set(date);
                
                options.time_max.callback();
            }
        });
        
//        d3.selectAll('#ui-datepicker-div button').classed('btn btn-default', true);
    }
}
