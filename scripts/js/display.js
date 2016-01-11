function Display() {
    var self = this;
    
    // Make display sizes
    var plot_area      = {height: 500, width: 960};
    var focus = {};
    var context = {};
    focus.margin   = {top: 10,  right: 10, bottom: 100, left: 75};
    context.margin = {top: 430, right: 10, bottom: 20,  left: 75};
    focus.width    = plot_area.width  - focus.margin.left - focus.margin.right;
    focus.height   = plot_area.height - focus.margin.top  - focus.margin.bottom;
    context.width  = focus.width;
    context.height = plot_area.height - context.margin.top - context.margin.bottom;
    
    // Loading Spinner
    self.spin = new Spinner({
        lines: 11,
        color: '#000',
        length: 50,
        width: 10,
        radius: 25,
        top: focus.margin.top + focus.height / 2 + "px",
        left: focus.margin.left + focus.width / 2 + "px"
    });
    
    // Link to self
    self.focus = focus;
    self.context = context;
    self.plot_area = plot_area;
    self.color = {};
    self.brush = {};
}

Display.prototype = {
    toggleLoading: function(toggle) {
        if(toggle) {
            $('#timeseries_div').append(this.spin.spin().el);
            d3.select('#charts')
                .style("opacity", 0.5);
        } else {
            this.spin.stop();
            d3.select('#charts')
                .style("opacity", 1);
        }
    },
    setColorScale: function() {
        switch(options.color_scale.get()) {
            case "category10":
                this.color = d3.scale.category10();
                break;
            case "category20":
                this.color = d3.scale.category20();
                break;
            case "category20b":
                this.color = d3.scale.category20b();
                break;
            case "category20c":
                this.color = d3.scale.category20c();
                break;
            default:
                this.color = d3.scale.category10();
                break;
        }
    },
    setYScale: function() {
        var focus = this.focus;
        
        if(options.y_scale.is("linear")) {
            focus.y = d3.scale.linear()
                .range([focus.height, 0]);
            focus.y_context = d3.scale.linear()
                .range([focus.height, 0]);
            focus.yAxis.scale(focus.y)
                .tickFormat(null);
        } else if(options.y_scale.is("pow")) {
            focus.y = d3.scale.sqrt()
                .range([focus.height, 0]);
            focus.y_context = d3.scale.sqrt()
                .range([focus.height, 0]);
            focus.yAxis.scale(focus.y)
                .tickFormat(null);
        } else if(options.y_scale.is("log")) {
            focus.y = d3.scale.log()
                .clamp(true)
                .range([focus.height, 0]);
            focus.y_context = d3.scale.log()
                .clamp(true)
                .range([focus.height, 0]);
            focus.yAxis.scale(focus.y)
                .tickFormat(focus.y.tickFormat(10, ",.0f"));
        }
    },
    init: function() {
        var focus = this.focus;
        var context = this.context;
        var plot_area = this.plot_area;
    
        focus.x = d3.time.scale()
            .range([0, focus.width]);
        context.x = d3.time.scale()
            .range([0, context.width]);

        focus.y = d3.scale.linear()
            .range([focus.height, 0]);
        focus.y_context = d3.scale.linear()
            .range([focus.height, 0]);
        context.y = d3.scale.linear()
            .range([context.height, 0]);
        
        this.setColorScale();
        
        focus.xAxis = d3.svg.axis()
            .scale(focus.x)
            .tickSize(-focus.height)
            .orient("bottom");

        context.xAxis = d3.svg.axis()
            .scale(context.x)
            .orient("bottom");

        focus.yAxis = d3.svg.axis()
            .scale(focus.y)
            .orient("left");
        focus.yAxis_context = d3.svg.axis()
            .scale(focus.y_context)
            .orient("right");

        context.yAxis = d3.svg.axis()
            .scale(context.y)
            .ticks(2)
            .orient("left");

        focus.area = d3.svg.area()
            .interpolate(options.shape.get())
            .x(function (d) { return focus.x(d.timestamp); });
        focus.area_context = d3.svg.area()
            .interpolate(options.shape.get())
            .x(function (d) { return focus.x(d.timestamp); });

        context.area = d3.svg.area()
            .interpolate(options.shape.get())
            .x(function(d) { return context.x(d.timestamp); })
            .y0(context.height)
            .y1(function(d) { return context.y(d._total_); });
        
        this.brush = d3.svg.brush()
            .x(context.x)
            .on("brush", function() { disp.setFocusTime('brush'); } );
                
        
        plot_area.svg = d3.select("svg#timeseries")
            .attr("width", plot_area.width)
            .attr("height", plot_area.height);

        focus.svg = plot_area.svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + focus.margin.left + "," + focus.margin.top + ")");

        context.svg = plot_area.svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + context.margin.left + "," + context.margin.top + ")");

        focus.svg.append("text")
            .attr('id', 'y_label')
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - focus.margin.left)
            .attr("x", 0 - (focus.height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Count of <Subset> Tweets Every <Resolution>");

        focus.svg.append("path")
            .attr('class', 'column_hover')
            .style('display', 'none')
            .style('fill', 'black')
            .style('stroke', 'black')
            .style('fill-opacity', '0.2')
            .style('stroke-opacity', '0.6');
        
        data.loadCollections();
    },
    loadCollections: function () {
        disp.toggleLoading(true);

        // Collection selection
        d3.json("scripts/php/getCollections.php", data.parseCollectionsFile);
    },
    parseCollectionsFile: function(error, collections_file) {
        if (error) throw error;

        // Add collections
        collections_file.sort(util.compareCollections);
        collections_file.reverse();
        data.collections = collections_file;

        // Get new data
        data.collection_names = data.collections.map(function(collection) {
            return collection.Name;
        });
        data.collections.map(function(collection) {
            collection.Keywords = collection.Keywords.trim().split(/,[ ]*/);
            collection.OldKeywords = collection.OldKeywords.trim().split(/,[ ]*/);
            if(collection.OldKeywords.length == 1 && collection.OldKeywords[0] == "")
                collection.OldKeywords = [];
            collection.StartTime = new Date(collection.StartTime);
            collection.StartTime.setMinutes(collection.StartTime.getMinutes()
                                           -collection.StartTime.getTimezoneOffset());
            if(collection.StopTime)
                collection.StopTime = new Date(collection.StopTime);
            else
                collection.StopTime = "Ongoing";
        });

        // Generate options, including collections
        options.collection.labels = data.collection_names;
        options.collection.ids = data.collection_names.map(function(name) { return util.simplify(name); } );
        options.collection.available = data.collection_names.map(function(d, i) { return i; });
        options.collection.set(util.simplify(data.collection_names[0]));

        options.init();

        // Add additional information for collections
        data.collection_names.map(function(name, i) {
            var content = '<dl class="dl-horizontal collection_popover">';
            var collection = data.collections[i];
            Object.keys(collection).map(function(key) {
                content += "<dt>" + key + "</dt>";

                if(collection[key] instanceof Date) {
                    var date = new Date(collection[key]);
                    content += "<dd>" + util.formatDate(date) + "</dd>";
                } else if(collection[key] instanceof Array) {
                    var arr = collection[key].join(", ");
                    content += "<dd>" + arr + "</dd>";
                } else {
                    content += "<dd>" + collection[key] + "</dd>";
                }
            });
            content += "</dl>";

            d3.select('#collection_' + util.simplify(name))
                .attr({
                    'class': 'collection_option',
                    'data-toggle': "popover",
                    'data-trigger': "hover",
                    'data-placement': "right",
                    'data-content': content}
                 );
        });
        $('.collection_option').popover({html: true});

        // Initialize Legend
        legend = new Legend();
        legend.init();

        data.loadCollectionData();
    },
    display: function() {
        // Set the Y Scale
        disp.setYScale();

        // Turn off the column hover if it is on
        disp.focus.svg.select('path.column_hover')
                    .style('display', 'none');

        if (options.display_type.is("wiggle")) {
            data.stack.offset("wiggle");
        } else if (options.display_type.is("stream_expand")) {
            data.stack.offset("expand");
        } else if (options.display_type.is("stream")) {
            data.stack.offset("silhouette");
        } else {
            data.stack.offset("zero");
        }

        // Set stack representation of data
        if(options.display_type.is("percent")) {
            data_100 = data.series.map(function(series) {
                var new_series = JSON.parse(JSON.stringify(series));
                new_series.values = new_series.values.map(function(datum, i) {
                    var new_datum = datum;
                    new_datum.timestamp = new Date(new_datum.timestamp);
                    new_datum.value *= 100 / data.total_byTime[i];
                    return new_datum;
                });
                return new_series;            
            });
            data.stacked = data.stack(data_100);
        } else {
            data.stacked = data.stack(data.series);
        }

        // Change data for display
        var n_series = data.stacked.length;
        if(n_series == 0) {
            disp.toggleLoading(false);
            alert('No data');
            return;
        }
        n_datapoints = data.stacked[0].values.length;
        if(options.display_type.is("separate")) {
            for (var i = n_series - 1; i >= 0; i--) {
                data.stacked[i].offset = 0;
                if(i < n_series - 1) {
                    data.stacked[i].offset = data.stacked[i + 1].offset;
                    if(data.series[i + 1].shown)
                        data.stacked[i].offset += data.stacked[i + 1].max;
                }

                data.stacked[i].values.map(function(datum) {
                    datum.value0 = data.stacked[i].offset;
                });
            }
        } 

        // I want the starting chart to emanate from the
        // middle of the display.
        disp.focus.area
            .interpolate(options.shape.get())
            .y0(focus.height / 2)
            .y1(focus.height / 2);

        // Set the Y Domain
        var y_min = 0;
        if(options.y_scale.is("log"))
            y_min = 1;

        var y_max = 100;
        var biggest_datapoint = // data is defined by its own maxes
            d3.max(data.stacked.map(function (d) {
                return d.max;
            }));
        var highest_datapoint = // because of stacked data
            d3.max(data.stacked[0].values.map(function (d) {
                return d.value0 + d.value;
            }));
        var biggest_totalpoint = 
            d3.max(data.context_byTime.map(function (d) {
                return d.value;
            }));

        if(options.y_max_toggle.get() == "true") {
            y_max = options.y_max.get();
        } else {
            if (options.display_type.is('overlap') | options.display_type.is('lines')) {
                y_max = biggest_datapoint;

                if(options.context_line.is("true"))
                    y_max = Math.max(y_max, biggest_totalpoint);
            } else if (options.display_type.is('percent')) {
                y_max = 100;
            } else {
                y_max = highest_datapoint;
                if(options.context_line.is("true"))
                    y_max = Math.max(y_max, biggest_totalpoint);
            }
            options.y_max.update(y_max);
            options.y_max.set(y_max);
        }

        disp.focus.y.domain([y_min, y_max])
            .range([disp.focus.height, 0]);
        disp.focus.y_context.domain([y_min, y_max])
            .range([disp.focus.height, 0]);

        if(options.y_scale.is("log")) {
            disp.focus.yAxis.scale(disp.focus.y)
                .tickFormat(disp.focus.y.tickFormat(10, ",.0f"));
        }

        // Create y Axises
        var ax = disp.focus.svg.select("g#yAxis");
        if(!ax[0][0])
            ax = disp.focus.svg.append('g').attr('id', 'yAxis');
        ax.attr("class", "y axis")
            .transition().duration(1000)
            .call(disp.focus.yAxis);

        ax = disp.context.svg.select("g#context_yAxis");
        if(!ax[0][0])
            ax = disp.context.svg.append('g').attr('id', 'context_yAxis');
        ax.attr("class", "context_y axis")
            .call(disp.context.yAxis);

        disp.display_context_line();

        // Bind new series to the graph

        var series = disp.focus.svg.selectAll(".series")
            .data(data.stacked);

        var series_paths = series.enter().append("g")
    //        .on("mouseover", legend.highlightSeries)
            .on("mouseout", legend.unHighlightSeries)
            .on("click", function(d) {
                var xy = d3.mouse(this);
                var time = disp.focus.x.invert(xy[0]);
                var coeff = 1000 * 60; // get a minute on other side
                if(options.resolution.is('tenminute')) {
                    coeff *= 10;
                } else if(options.resolution.is('hour')) {
                    coeff *= 60;
                } else if(options.resolution.is('day')) {
                    coeff *= 60 * 24;
                }
                var startTime = new Date(Math.floor(time.getTime() / coeff) * coeff)
                var stopTime = new Date(startTime.getTime() + coeff)

                data.getTweets(d, startTime, stopTime);
            })
            .on("mouseover", legend.highlightSeries)
            .on("mouseout", function(d) {
                disp.focus.svg.select('path.column_hover')
                    .style('display', 'none');

                legend.unHighlightSeries(d)
            })
            .on("mousemove", function(d) {
                var xy = d3.mouse(this);
                var time = disp.focus.x.invert(xy[0]);
                var coeff = 1000 * 60; // get a minute on other side
                if(options.resolution.is('tenminute')) {
                    coeff *= 10;
                } else if(options.resolution.is('hour')) {
                    coeff *= 60;
                } else if(options.resolution.is('day')) {
                    coeff *= 60 * 24;
                }
                var startTime = new Date(Math.floor(time.getTime() / coeff) * coeff)
                var stopTime = new Date(startTime.getTime() + coeff)

                var focus_column = disp.focus.svg.select('path.column_hover');
                var old_data = focus_column.data();

    //            var value_i = Math.floor(xy[0] / focus.width * d.values.length);
                var value_i = timestamps_nested.indexOf(startTime + "");
                var value = d.values[value_i].value;
                var value0 = d.values[value_i].value0;

                if(!old_data || old_data.series != d.id ||
                   old_data.startTime != startTime || old_data.stopTime != stopTime) {

                    focus_column.data([{
                        series: d.id,
                        startTime: startTime,
                        stopTime: stopTime,
                        value: value,
                        value0: value0
                    }]);

                    focus_column
                        .transition()
                        .duration(50)
                        .attr("d", 
                            disp.focus.area([
                                {timestamp: startTime, value: value, value0: value0},
                                {timestamp: stopTime, value: value, value0: value0}
                            ]))
                        .style('display', 'block');
                }

                if(!old_data || old_data.series != d.id)
                    legend.highlightSeries(d);
            });

        series.attr("class", function(d) {
                return "series " + d.id
            });

        series.exit().remove();

        series_paths.append("path")
            .attr("class", "area");

        // Define the parameters of the area
        if (options.display_type.is('overlap') | options.display_type.is('lines')) {
            disp.focus.area
                .y0(disp.focus.height)
                .y1(function (d) { return disp.focus.y(d.value); });
        } else {
            disp.focus.area
                .y0(function (d) { return disp.focus.y(d.value0); })
                .y1(function (d) { return disp.focus.y(d.value0 + d.value); });
        }

        // here we create the transition
        var transition = disp.focus.svg.selectAll(".series")
            .transition()
            .duration(750)

        // Transition to the new area
        var fill_opacity = options.display_type.is("lines") ? 0.0 : 
                        (options.display_type.is("overlap") ? 0.1 : 0.8);

        disp.focus.svg.selectAll(".series")
            .classed("lines", false);
        transition.select("path.area")
            .style("fill", function (d) { return disp.color(d.name); })
            .style("fill-opacity", fill_opacity)
            .style("stroke", function (d) { return d3.rgb(disp.color(d.name)).darker(); })
    //        .style("stroke-opacity", 1.0)
            .attr("d", function(d) { return disp.focus.area(d.values)});

        disp.toggleLoading(false);
    },
    setContextTime: function(time_min, time_max) {
        // Establish the maximum and minimum time of the data series
        var startTime = options.time_min.get();
        var endTime =   options.time_max.get();

        if(startTime.getTime() == endTime.getTime() || options.time_save.get() == "false") {
            startTime = time_min;
            endTime = time_max;
        } else {
            if(startTime < time_min || startTime > time_max)
                startTime = time_min;
            if(endTime < time_min || endTime > time_max)
                endTime = time_max;
        }

        // Set the context and focus domains
        disp.context.x.domain([time_min, time_max]);
        disp.focus.x.domain(disp.brush.empty() ? [startTime, endTime] : disp.brush.extent());

        // Initialize the brush if it isn't identical
        if(startTime > time_min || endTime < time_max) {
            disp.brush.extent([startTime, endTime]);
        }

        // Set the time option
        options.time_min.set(startTime);
        options.time_min.min = new Date(time_min);
        options.time_max.set(endTime);
        options.time_max.max = new Date(time_max);

        // Set the manual field constraints
        var startDateTextBox = $('#choose_time_min');
        startDateTextBox.datetimepicker('option', 'minDate', time_min);
        startDateTextBox.datetimepicker('option', 'maxDate', endTime);
        startDateTextBox.datetimepicker("setDate", startTime);

        var endDateTextBox = $('#choose_time_max');
        endDateTextBox.datetimepicker('option', 'minDate', startTime);
        endDateTextBox.datetimepicker('option', 'maxDate', time_max);
        endDateTextBox.datetimepicker("setDate", endTime);
    },
    setFocusTime: function(origin) {
        var startDateTextBox = $('#choose_time_min');
        var endDateTextBox = $('#choose_time_max');
        var startTime, endTime;
        var brushEvent = false;

        // Get time from the originator of this request
        if(origin == "brush") {
            var times = disp.brush.extent();
            startTime = times[0];
            endTime   = times[1];

            brushEvent = true;
        } else if(origin == "input_field") {
            startTime = startDateTextBox.datetimepicker('getDate');
            endTime   =   endDateTextBox.datetimepicker('getDate');
        } else if(origin == "button_time_to_start") { // The min and max possible?
            startTime = new Date(options.time_min.min);
        } else if(origin == "button_time_minus_6h") { // The min and max possible?
            startTime = options.time_min.get();
            startTime.setHours(startTime.getHours() - 6);
        } else if(origin == "button_time_minus_1h") { // The min and max possible?
            startTime = options.time_min.get();
            startTime.setHours(startTime.getHours() - 1);
        } else if(origin == "button_time_to_end") { // The min and max possible?
            endTime   = new Date(options.time_max.max);
        } else if(origin == "button_time_plus_1h") { // The min and max possible?
            startTime = options.time_min.get();
            startTime.setHours(startTime.getHours() + 1);
        } else if(origin == "button_time_plus_6h") { // The min and max possible?
            startTime = options.time_min.get();
            startTime.setHours(startTime.getHours() + 6);
        }

        if(!startTime)
            startTime = options.time_min.get();
        if(!endTime)
            endTime   = options.time_max.get();

        // Bound the start and end times
        if(startTime < options.time_min.min)
            startTime = new Date(options.time_min.min);
        if(endTime > options.time_max.max)
            endTime = new Date(options.time_max.max);
        if(startTime >= endTime ) {
            startTime = new Date(options.time_min.min);
            endTime = new Date(options.time_max.max);
        }

        startDateTextBox.datetimepicker("setDate", startTime);
          endDateTextBox.datetimepicker("setDate", endTime);

        options.time_min.set(startTime);
        options.time_max.set(endTime);

        if(startTime > options.time_min.min || endTime < options.time_max.max) {    
            if(!brushEvent) {
                // Update the brush
                disp.brush.extent([startTime, endTime])
                disp.brush(d3.select(".brush").transition());
                disp.brush.event(d3.select(".brush").transition())
            }
        } else {
            d3.selectAll(".brush").call(disp.brush.clear());//brush.clear();
        }

        options.recordState(options, 'time_min');
        options.recordState(options, 'time_max');

        disp.focus.x.domain(disp.brush.empty() ? disp.context.x.domain() : disp.brush.extent());
        disp.focus.svg.selectAll("path.area")
            .attr("d", function(d) { return disp.focus.area(d.values)});
        disp.focus.svg.selectAll("path.area_context")
            .attr("d", function(d) { return disp.focus.area_context(d)});
        disp.focus.svg.select(".x.axis")
            .call(disp.focus.xAxis);
    },
    setColors: function() {
        disp.setColorScale();

        // Set color values
        disp.color.domain(data.series.map(function(series) {return series.name;}));

        data.series.map(function(series) {
            series.fill = disp.color(series.name);
            series.stroke = d3.rgb(disp.color(series.name)).darker();

            d3.select("." + series.id + " .legend_icon")
                .style('fill', series.fill)
                .style('stroke', series.stroke);
        });
    },
    display_context_line: function() {    
        // Find or create context line
        var container = disp.focus.svg.select("g#y_context");
        if(!container[0][0]) {
            container = disp.focus.svg.append('g')
                .attr('id', 'y_context');
            container.append('path')
                .attr('class', 'area_context context_line')
        }

        // Update Data
        container.data([data.context_byTime]);

        var transition = container
            .transition()
            .duration(750);

        var multiplier = 1;
        if(options.display_type.is('percent')) {
            var biggest_totalpoint = data.context_byTime.reduce(function (cur_max, d) {
                return Math.max(cur_max, d.value);
            }, 0);
            multiplier = 100 / biggest_totalpoint;
        }

        disp.focus.area_context
            .interpolate(options.shape.get())
            .y0(disp.focus.height)
            .y1(function (d) { return disp.focus.y_context(d.value * multiplier); });

        if(options.context_line.is("false"))
            disp.focus.area_context.y1(disp.focus.height);

        transition.select("path.area_context")
            .attr("d", function(d) { return disp.focus.area_context(d)});

        // Set visibility
        legend.key.select('.legend_key_context_line')
            .classed('hidden', options.context_line.is("false"));
    //    container.style('display', options.context_line.is("true") ? 'block' : 'none');
    }
}