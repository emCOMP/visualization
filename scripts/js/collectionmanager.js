function CollectionManager(app, args) {
    this.app = app;
    args = args || {};
    this.name = args.name || 'Dataset';
    this.flag_subset_menu = args.flag_subset_menu || false;
    this.flag_sidebar = args.flag_sidebar || true;
    this.ops = {};
    
    this.event_names;
    this.events_arr;
    this.events;
    this.event;
    
    this.time = {};

    this.subsets_arr;
    this.subsets;
    this.subset;
    
    this.init();
    
    this.edit_window_fields = {
        omitted: ['Tweets', 'Originals', 'Retweets', 'Replies', 'Quotes',
                 'DistinctTweets', 'DistinctOriginals', 'DistinctRetweets', 'DistinctReplies', 'DistinctQuotes',
                 'TweetsDisplay', 'OriginalsDisplay', 'RetweetsDisplay', 'RepliesDisplay', 'QuotesDisplay',
                 'Level', 'Datapoints', 'Label', 'FirstTweet', 'LastTweet',
                 'Month', 'DisplayMatch', 'type'],
        id: ['ID', 'Event', 'Rumor'],
        text: ['DisplayName', 'Superset', 'Feature', 'Match', 'Notes', 'Level', 'Type', 'Description', 'Active'],
        date: ['StartTime', 'StopTime'],
        textarea: ['Description', 'Definition'],
        query: ['Query']
    }
}
CollectionManager.prototype = {
    init: function() {
        this.setTriggers();
    },
    setTriggers: function() {
        triggers.on('collectionManager:build', this.build.bind(this));
        
        // Dataset changes
        if(this.flag_sidebar) {
            triggers.on('events:load', this.loadEvents.bind(this));
            triggers.on('events:updated', this.populateEventOptions.bind(this));
            triggers.on('event_type:set', this.chooseEventType.bind(this));
            triggers.on('event:set', this.setEvent.bind(this));
            triggers.on('event:updated', this.loadSubsets.bind(this));
            if(this.flag_subset_menu) {
                triggers.on('subsets:updated', this.populateSubsetOptions.bind(this));
                triggers.on('subset:set', this.setSubset.bind(this));
            }
        }

        // Editing Windows
        triggers.on('edit_window:open', this.editWindow.bind(this));
        triggers.on('edit_window:changed', this.editWindowChanged.bind(this));
        triggers.on('edit_window:update', this.updateCollection.bind(this));
        triggers.on('edit_window:verify update', this.verifyCollectionUpdate.bind(this));
        triggers.on('time_window:edit', this.editLoadTimeWindow.bind(this));
        triggers.on('time_window:choose', function() {
            if(this.ops['Time Window'].is('custom')) {
                triggers.emit('time_window:edit');
            } else {
                triggers.emit('time_window:set');
//                triggers.emit('event:load_timeseries');
            }
        }.bind(this));
        triggers.on('time_window:set', this.configureLoadTimeWindow.bind(this));  
    },
    build: function() {
        this.setOptions();
        triggers.emit('events:load');
    },
    setOptions: function() {
        this.ops = {
            'Event Type': new Option({
                title: "Type",
                labels: ["All", "Other Type"],
                ids:    ["All", "Other Type"],
                default: 0,
                custom_entries_allowed: true,
                callback: triggers.emitter('event_type:set')
            }),
            Event: new Option({
                title: "Event",
                labels: ["none"],
                ids:    ["none"],
                default: 0,
                custom_entries_allowed: true,
                callback: triggers.emitter('event:set'),
                edit: function() { triggers.emit('edit_window:open', 'event'); }
            }),
            'Time Window': new Option({
                title: "Time",
                labels: ["First Day", "First 3 Days", "Whole Collection", "Custom",],
                ids:    ['1d', '3d', 'all', 'custom'],
                default: 0,
                callback: triggers.emitter('time_window:choose'),
                edit: triggers.emitter('time_window:edit')
            }),
            'Time Min': new Option({
                title: "Time Min",
                labels: [''],
                ids: [''],
                date: new Date(),
                default: 0,
                hidden: true,
                custom_entries_allowed: true
            }),
            'Time Max': new Option({
                title: "Time Max",
                labels: [''],
                ids: [''],
                date: new Date(),
                default: 0,
                hidden: true,
                custom_entries_allowed: true
            })
        };
        var dropdowns = ['Event Type', 'Event', 'Time Window'];
        if(this.flag_subset_menu) {
            var dropdowns = ['Event Type', 'Event', 'Subset', 'Time Window'];
            this.ops['Subset'] = new Option({
                title: "Subset",
                labels: ["none"],
                ids:    ["none"],
                default: 0,
                custom_entries_allowed: true,
                callback: triggers.emitter('subset:set'),
                edit: function() { triggers.emit('edit_window:open', 'subset'); }
            });
        }
        
        // Save to main options menu and build dropdowns
        this.app.ops[this.name] = this.ops;
        dropdowns.forEach(function(option_name) {
            this.app.ops.buildSidebarOption(this.name, option_name);
        }, this);
    },
    loadEvents: function () {
        // Event selection
        this.app.connection.php('collection/getEvent', {},
                     this.parseEventsFile.bind(this));
    },
    parseEventsFile: function (data) {
        // Add events (collections)
        this.events_arr = JSON.parse(data);
        this.events_arr.sort(util.compareCollections);
        this.events_arr.reverse();
        
        this.events = {};
        this.events_arr.forEach(function(event) {
            this.events[event['ID']] = event;
        }, this);
        
        // Format collection data
        this.events_arr.forEach(function (event) {
            // Keywords
            event.Keywords = event['Keywords'] ? event.Keywords.trim().split(/,[ ]*/) : [];
            event.OldKeywords = event['OldKeywords'] ? event.OldKeywords.trim().split(/,[ ]*/) : [];
            if (event.OldKeywords.length == 1 && event.OldKeywords[0] == "")
                event.OldKeywords = [];
            
            // Name
            if (!('DisplayName' in event) || !event['DisplayName'] || event['DisplayName'] == "null") {
                event.Label = event.Name;
                event.DisplayName = '';
            } else {
                event.Label = event.DisplayName;
            }
               
            // Time
            event.StartTime = event.StartTime ? util.date(event.StartTime) : new Date();
//            collection.StartTime.setMinutes(collection.StartTime.getMinutes()
//                                           -collection.StartTime.getTimezoneOffset());
            event.Month = util.date2monthstr(event.StartTime);
            if (event.StopTime) {
                event.StopTime = util.date(event.StopTime);
                if (event.StartTime.getMonth() != event.StopTime.getMonth() ) 
                    event.Month += ' to ' + util.date2monthstr(event.StopTime);
            } else {
                event.StopTime = "Ongoing";
                event.Month += '+';
            }
            event.Label += ' ' + event.Month;
        });

        
        // Make nicer event names
        this.event_names = this.events_arr.map(function (event) {
            return event.Label;
        });
        
        triggers.emit('events:updated');
    },
    setEvent: function () {
        var event_id = this.ops['Event'].get();
        this.event = this.events[parseInt(event_id)];
        
        // Save times for the collection
        this.time.event_min = new Date(this.event.StartTime);
        if(this.event.StopTime == "Ongoing") {
            this.time.event_max = new Date();
        } else {
            this.time.event_max = new Date(this.event.StopTime);
        }
        
        global_min_id = this.event.FirstTweet || util.timestamp2TwitterID(this.time.event_min);
        global_max_id = this.event.LastTweet  || util.timestamp2TwitterID(this.time.event_max);
        
        triggers.emit('event:updated', this.event);
    },
    setSubset: function() {
        var subset_id = this.ops['Subset'].get();
        this.subset = this.subsets[parseInt(subset_id)];
        
        
        triggers.emit('subset:updated', this.subset);
    },
    updateCollection: function() {
        var fields = {};
        $("#edit_form").serializeArray().forEach(function(x) { console.log(x); fields[x.name] = x.value; });
        
        this.app.connection.php('collection/update', fields, triggers.emitter('edit_window:verify update')); // add a callback
    },
    verifyCollectionUpdate: function(message) {
        if(message.includes('Success')) {
            triggers.emit('events:load');
            
            // Turn update to normal
            d3.select('#edit-window-save')
                .attr('class', 'btn btn-default');

            // Unlock Match/Fetch buttons
            d3.selectAll('.edit-window-routine')
                .attr('disabled', null);
        } else {
            console.error(message);
        }
    },
    loadSubsets: function () {
        // Event selection
        this.app.connection.php('collection/getSubset', {event: this.event.ID},
             this.parseSubsetsFile.bind(this));
    },
    parseSubsetsFile: function(filedata) {
        try {
            filedata = JSON.parse(filedata);
        } catch (exception) {
            console.log(filedata);
            return;
        }
        
        this.subsets = {};
        this.subsets_arr = filedata;
        this.subsets_arr.forEach(function(subset) {
            subset.DisplayMatch = subset.Match.replace(/\\W/g, '<span style="color:#ccc">_</span>');
            if(subset.Feature == 'User.UTCOffset') {
                var hours = parseFloat(subset.DisplayMatch) / 60 / 60;
                subset.DisplayMatch = 'UTC' + (hours >= 0 ? '+' : '-');
                hours = Math.abs(hours);
                subset.DisplayMatch +=
                    (hours < 10 ? '0' : '') +
                    hours.toFixed(0) + ':' +
                    (hours * 6 % 6).toFixed(0) + (hours * 60 % 10).toFixed(0);
            }
            subset.Label = subset.Feature + ': ' + subset.DisplayMatch;
            
            this.subsets[subset.ID] = subset;
        }, this);
        
        triggers.emit('subsets:updated');
        
        // Populate the list of options
//        options.buildRumors();
    },
    populateEventOptions: function() {
        var event_op = this.ops['Event'];
        var event_type_op = this.ops['Event Type'];
        
        // Generate Collections List
        event_op['labels'] = this.event_names;
        event_op['ids'] = this.events_arr.map(function(event) { return event['ID']; });
        event_op['available'] = util.range(this.events_arr.length);
        
        // Find the current collection
        var cur = event_op.get();
        event_op.default = this.events_arr.reduce(function(candidate, event, i) {
            if(event['ID'] == cur)
                return i;
            return candidate;
        }, 0);
        event_op.set(event_op['ids'][event_op.default]);
        
        // Make the dropdown
        this.app.ops.buildSidebarOption(this.name, 'Event');
        this.app.ops.recordState(true);
        triggers.emit('event:set', this.event);
        
        // Generate Types of Collections
        var types = util.lunique(this.events_arr.map(function(event) { return event['Type']; }));
        types.unshift('All'); // Add 'All' to begining
        
        event_type_op['labels'] = types;
        event_type_op['ids'] = types;
        event_type_op['available'] = util.range(types.length);
        
        // Set the type to match the current collection
        event_type_op.default = event_type_op['ids'].indexOf(this.events_arr[event_op.default]['Type']);
        event_type_op.set(types[event_type_op.default]);
        
        // Make the dropdown for collection types
        this.app.ops.buildSidebarOption(this.name, 'Event Type');
        this.app.ops.recordState(true);

        // Add additional information for events
        this.app.tooltip.attach('#choose_l' + this.name + '_lEvent a', function(d) {
            var event = this.events_arr[d];
            event = JSON.parse(JSON.stringify(event));

            ['Tweets', 'Originals', 'Retweets', 'Replies', 'Quotes'].forEach(function(quantity) {
                event[quantity + ' <small>(Distinct)</small>'] = util.formatThousands(event[quantity]);
                if(event['Distinct' + quantity]) {
                    event[quantity + ' <small>(Distinct)</small>'] += 
                        ' <small style="left: 200px; position: absolute">(' +
                        util.formatThousands(event['Distinct' + quantity]) + ')</small>'; 
                }
                delete event[quantity];
                delete event['Distinct' + quantity];
            });

            return event;
        }.bind(this));

        // Limit the collection selections to the particular type
        triggers.emit('event_type:set');
    },
    populateSubsetOptions: function() {
        var subset_names = this.subsets_arr.map(function(subset) {
            return subset.Label;
        });
        
        // Generate Collections List
        subset_op = this.ops['Subset'];
        subset_op['labels'] = subset_names;
        subset_op['labels'].unshift('None');
        subset_op['labels'].push('- New -');
        subset_op['ids'] = this.subsets_arr.map(function(subset) { return subset['ID']; });
        subset_op['ids'].unshift('_none_');
        subset_op['ids'].push('_new_');
        subset_op['available'] = util.range(subset_op['labels'].length);
        
        // Find the current collection
        var cur = subset_op.get();
        subset_op.default = this.subsets_arr.reduce(function(candidate, subset, i) {
            if(subset['ID'] == cur)
                return i;
            return candidate;
        }, 0);
        subset_op.set(subset_op['ids'][subset_op.default]);
        
        // Make the dropdown
        this.app.ops.buildSidebarOption(this.name, 'Subset');
        this.app.ops.recordState(true);
        
        // Add additional information for subsets
        this.app.tooltip.attach('#choose_l' + this.name + '_lSubset a', function(d) {
            var subset;
            if(d > 0 && d <= this.subsets_arr.length) { // Regular subset
                subset = this.subsets_arr[d - 1];
                subset = JSON.parse(JSON.stringify(subset));
            } else if (d == 0) { // None option
                return {Name: 'None'};
            } else { // New subset option
                return {Click: ' to make new subsets'}
            }

            ['Tweets', 'Originals', 'Retweets', 'Replies', 'Quotes'].forEach(function(quantity) {
                if(subset['Distinct' + quantity] && subset['Distinct' + quantity] > 0) {
                    subset[quantity + ' <small>(Distinct)</small>'] =
                        util.formatThousands(subset[quantity]) + 
                        ' <small style="left: 200px; position: absolute">(' +
                        util.formatThousands(subset['Distinct' + quantity]) + ')</small>'; 
                } else {
                    subset[quantity + ' <small>(Distinct)</small>'] =
                        util.formatThousands(subset[quantity]); 
                }
                delete subset['Distinct' + quantity];
                delete subset[quantity];
            });
            subset['Datapoints'] = util.formatMinutes(subset['Datapoints']);

            return subset;
        }.bind(this));
        
        triggers.emit('subset:set');
    },
    chooseEventType: function() {
        var event_op = this.ops['Event'];
        var curType = this.ops['Event Type'].get();
        var curEvent = event_op.get();
        var firstValid = -1; 
        
        this.events_arr.map(function(event, i) {
            if(event['Type'] == curType || 'All' == curType) {
                d3.select('#Event_' + event['ID'])
                    .style('display', 'block');
                
                if(firstValid == -1)
                    firstValid = i;
            } else {
                d3.select('#Event_' + event['ID'])
                    .style('display', 'none');
                
                if(event['ID'] == curEvent)
                    curEvent = 'invalid';
            }
        });
        
        // If the current collection does not match this type, then make a new one
        if(curEvent == 'invalid') {
            event_op.updateInInterface(firstValid);

            triggers.emit("event:set");
        }
    },
    configureLoadTimeWindow: function() {
        var window = this.ops['Time Window'].get();
        var time_min_op = this.ops['Time Min'];
        var time_max_op = this.ops['Time Max'];
        var time_obj = this.time;
        
        if(window == '1d') {
            time_min_op.date = new Date(time_obj.event_min);
            time_max_op.date = new Date(time_obj.event_min);
            time_max_op.date.setHours(time_max_op.date.getHours() + 24);
        } else if(window == '3d') {
            time_min_op.date = new Date(time_obj.event_min);
            time_max_op.date = new Date(time_obj.event_min);
            time_max_op.date.setHours(time_max_op.date.getHours() + 24 * 3);
        } else if(window == 'all') {
            time_min_op.date = new Date(time_obj.event_min);
            time_max_op.date = new Date(time_obj.event_max);
        } else { // Custom
//            time_obj.selected_min = new Date(options.data_time.custom_min);
//            time_obj.selected_max = new Date(options.data_time.custom_max);
        }
        
        // Outer Bounds
        if(time_min_op.date < time_obj.event_min) {
            time_min_op.date = new Date(time_obj.event_min);
        }
        if(time_max_op.date > time_obj.event_max) {
            time_max_op.date = new Date(time_obj.event_max);
        }
        // Inner Bound
        if(time_max_op.date < time_min_op.date) {
            time_max_op.date = new Date(time_min_op.date);
        }
            
        // Set Text Fields
        time_min_op.set(util.formDate(time_min_op.date));
        time_max_op.set(util.formDate(time_max_op.date));
        this.app.ops.recordState(false);
    },
    editLoadTimeWindow: function() {
        var op_time_min = this.ops['Time Min'];
        var op_time_max = this.ops['Time Max'];
        var time_obj = this.time;
        
        op_time_min.custom = new Date(op_time_min.date);
        op_time_max.custom = new Date(op_time_max.date);
        
        // Set Modal Title
        triggers.emit('modal:reset');
        triggers.emit('modal:title', 'Set Time Window');
        
        // Append form
        var modal_body = this.app.modal.body;
        var form = modal_body.append('form')
            .attr({
                id: 'edit_form',
                method: 'post',
                class: 'form-horizontal'
            })
            .on('submit', function() {
                event.preventDefault();
                return false; 
            });
        
        var divs = form.selectAll('div.form-group')
            .data([{
                    label: 'From',
                    time: op_time_min.custom,
                    min: time_obj.event_min,
                    max: time_obj.event_max
                },{
                    label: 'To',
                    time: op_time_max.custom,
                    min: time_obj.event_min,
                    max: time_obj.event_max
                }])
            .enter()
            .append('div')
            .attr('class', 'form-group');
        
        divs.append('label')
            .attr('for', function(d) { return 'edit_load_time_' + d.label; })
            .attr('class', 'col-sm-3 control-label')
            .text(function(d) { return d.label });
        
        var entries = divs.append('div')
            .attr('class', 'col-sm-9 edit-box edit-box-date input-group')
            .style('width', '1px');
        
        entries.append('div')
            .attr('class', 'input-group-btn')
            .append('button')
            .attr('class', 'btn btn-default')
            .html('<span class="glyphicon glyphicon-step-backward"></span>')
            .on('click', function(d) {
                var ops_dataset = this.ops;
                if(d.label == 'From') {
                    ops_dataset['Time Min'].custom = new Date(this.time.event_min);
                    document.getElementById('edit_load_time_' + d.label).value = util.formDate(ops_dataset['Time Min'].custom);
                } else { // To
                    ops_dataset['Time Max'].custom = new Date(ops_dataset['Time Min'].custom);
                    document.getElementById('edit_load_time_' + d.label).value = util.formDate(ops_dataset['Time Max'].custom);
                }
            }.bind(this));
        
        entries.append('input')
            .attr({
                class: 'form-control',
                type: 'datetime-local',
                id: function(d) { return 'edit_load_time_' + d.label; },
                value: function(d) { return util.formDate(d.time); },
                min: function(d) { return util.formDate(d.min); },
                max: function(d) { return util.formDate(d.max); }
            })
            .on('change', function(d) {
                var ops_dataset = this.ops;
                var date = new Date(document.getElementById('edit_load_time_' + d.label).value);
                date.setHours(date.getHours() + 8);
                if(d.label == 'From') {
                    ops_dataset['Time Min'].custom = date;
                } else { // To
                    ops_dataset['Time Max'].custom = date;
                }
            }.bind(this));
        
        entries.append('div')
            .attr('class', 'input-group-btn')
            .append('button')
            .attr('class', 'btn btn-default')
            .html('<span class="glyphicon glyphicon-step-forward"></span>')
            .on('click', function(d) {
                var ops_dataset = this.ops;
                if(d.label == 'From') {
                    ops_dataset['Time Min'].custom = new Date(ops_dataset['Time Max'].custom);
                    document.getElementById('edit_load_time_' + d.label).value = util.formDate(ops_dataset['Time Min'].custom);
                } else { // To
                    ops_dataset['Time Max'].custom = new Date(this.time.event_max);
                    document.getElementById('edit_load_time_' + d.label).value = util.formDate(ops_dataset['Time Max'].custom);
                }
            }.bind(this));
        
        // Accept Button
        var ops = this.app.modal.options;
        ops.selectAll('*').remove();
        
        ops.append('button')
            .attr({
//                id: 'edit-window-tweetin',
                class: 'btn btn-primary edit-window-routine'
            })
            .on('click', function(d) {
                var ops_dataset = this.ops;
                // Set values
                ops_dataset['Time Window'].set('custom');
                ops_dataset['Time Min'].date = ops_dataset['Time Min'].custom;
                ops_dataset['Time Max'].date = ops_dataset['Time Max'].custom;
                
                // Close modal
                $('#modal').modal(false);
                
                // Functions
                triggers.emit('global_time_set');
                triggers.emit('event:load_timeseries'); // TODO
            }.bind(this))
            .text('Update');
        
        triggers.emit('modal:open');
    },
    editWindow: function(option) {
        
        var info = this[option];
        if(!info || !('ID' in info)) {
            triggers.emit('alert', 'No information');
            return;
        }
        
        // Set modal
        var modal = this.app.modal;
        triggers.emit('modal:reset');
        triggers.emit('modal:title', '<small>Configure ' + option + ':</small> ' + (info.Label));
        
        // Append form
        var form = modal.body.append('form')
            .attr({
                id: 'edit_form',
                method: 'post',
                class: 'form-horizontal'
            })
            .on('submit', function() {
                event.preventDefault();
                return false; 
            });
        
        var keys = [];
        Object.keys(info).forEach(function(key) {
            var value = info[key];
            if (!this.edit_window_fields.omitted.includes(key) && 
               (typeof(value) == 'string' || typeof(value) == 'number' || value instanceof Date) ) {
                keys.push(key);
            }
        }, this);
        
        var divs = form.selectAll('div.form-group')
            .data(keys)
            .enter()
            .append('div')
            .attr('class', 'form-group');
        
        divs.append('label')
            .attr('for', function(d) { return 'edit_input_' + d; })
            .attr('class', 'col-sm-3 control-label')
            .text(function(d) {
                // Convert CamelCase to Camel Case
                if(d.includes('ID'))
                    return d.replace('_', ' ');
                else
                    return d.replace(/([A-Z])/g, " $1");
            });
        
        divs.append('div')
            .attr('class', function(d) { 
                if(this.edit_window_fields.id.includes(d))
                    return 'col-sm-9 edit-box edit-box-id';
                else if(this.edit_window_fields.text.includes(d))
                    return 'col-sm-9 edit-box edit-box-textfield';
                else if(this.edit_window_fields.date.includes(d))
                    return 'col-sm-9 edit-box edit-box-date';
                else if(this.edit_window_fields.textarea.includes(d))
                    return 'col-sm-9 edit-box edit-box-textarea';
                else if(this.edit_window_fields.query.includes(d))
                    return 'col-sm-9 edit-box edit-box-query';
                else // Non editable
                    return 'col-sm-9 edit-box edit-box-static';
            }.bind(this));
        
        form.selectAll('.edit-box-id')
            .append('input')
            .attr({
                class: 'form-control',
                type: 'text',
                id: function(d) { return 'edit_input_' + d; },
                name: function(d) { return d.toLowerCase(); },
                value: function(d) { return info[d]; },
                readonly: function(d) { return info[d] ? false : true; }
            });
        
        form.selectAll('.edit-box-textfield')
            .append('input')
            .attr({
                class: 'form-control',
                type: 'text',
                id: function(d) { return 'edit_input_' + d; },
                name: function(d) { return d; },
                placeholder: function(d) { return info[d]; }
            });
        
        form.selectAll('.edit-box-textarea')
            .append('textarea')
            .attr({
                class: 'form-control',
                type: 'text',
                id: function(d) { return 'edit_input_' + d; },
                name: function(d) { return d; },
                rows: 3,
                placeholder: function(d) { return info[d]; }
            });
        
        form.selectAll('.edit-box-date') // TODO fix problem with display
            .append('input')
            .attr({
                class: 'form-control',
                type: 'datetime-local',
                id: function(d) { return 'edit_input_' + d; },
                name: function(d) { return d; },
                value: function(d) {
                    if(info[d] instanceof Date)
                        return util.formatDate(info[d]).replace(' ', 'T');
                }
            });
        
        if(keys.includes('Query'))
            this.queryEditCreate(form, info);
        
        form.selectAll('.edit-box-static')
            .append('p')
            .attr('class', 'form-control-static')
            .text(function(d) { return info[d]; });
        
        form.append('input')
            .attr({
                name: 'type',
                value: option,
                class: 'hidden'
            });
        
        // Add Lower Buttons
        modal.options.append('div')
            .append('button')
            .attr({
                id: 'edit-window-save',
                class: 'btn btn-default'
            })
            .text('Update')
            .on('click', triggers.emitter('edit_window:update'));
        
//        disp.newPopup('#edit-window-save')
//            .set('content', 'Otherwise won\'t save changes');
        
        if(option == 'rumor') {
            this.editWindowRumorOptions(modal);
        }
        
        form.selectAll('input')
            .on('input', triggers.emitter('edit_window:changed'));
        
        triggers.emit('modal:open');
    },
    editWindowRumorOptions: function(modal) {
        // TODO fix
        var option = 'rumor';
        
        var tweet_count = modal.options.append('div')
            .attr('id', 'edit-window-tweetin-div')
            .attr('class', 'input-group')
            .style('display', 'inline-table');
            
        tweet_count.append('span')
            .attr('class', 'input-group-addon')
            .text('Count:')
            .style('width', 'auto');

        tweet_count.append('input')
            .attr('id', 'edit-window-tweetin-count')
            .attr('class', 'text-center form-control')
            .attr('readonly', '')
            .style('width', '80px')
            .attr('value', 0);
        
        data.getRumorCount();

        tweet_count.append('div')
            .attr('class', 'input-group-btn')
            .style('margin', '0px')
            .append('button')
            .data([option])
            .attr({
                id: 'edit-window-tweetin',
                class: 'btn btn-primary edit-window-routine'
            })
            .on('click', data.genTweetInCollection)
            .append('span')
            .attr('class', 'glyphicon glyphicon-refresh');
        
        modal.options.append('div')
            .attr('id', 'edit-window-gencount-div')
            .append('button')
            .data([option])
            .attr({
                id: 'edit-window-gencount',
                class: 'btn btn-primary edit-window-routine'
            })
            .on('click', data.rmTweetCount)
            .text('Count Tweets');
//            .append('span')
//            .attr('class', 'glyphicon glyphicon-signal');
        
//        modal.options.append('div')
//            .attr('id', 'edit-window-gencodecount-div')
//            .append('button')
//            .data([option])
//            .attr({
//                id: 'edit-window-gencodecount',
//                class: 'btn btn-primary edit-window-routine'
//            })
//            .on('click', data.rmCodeCount)
//            .text('Count Codes');
//            .append('span')
//            .attr('class', 'glyphicon glyphicon-signal');

        modal.options.append('div')
            .attr('id', 'edit-window-fetch100-div')
            .append('button')
            .data([option + " 100"])
            .attr({
                id: 'edit-window-fetch100',
                class: 'btn btn-primary edit-window-routine'
            })
            .on('click', function() {
                data.getTweets({
                    limit: 300,
                    distinct: 1,
                    rand: '',
                    rumor_id: data.rumor.ID,
                    csv: ''
                });
            })
            .html('<span class="glyphicon glyphicon-download-alt"></span> 100 Rand');

        modal.options.append('div')
            .attr('id', 'edit-window-fetchall-div')
            .append('button')
            .data([option + " all"])
            .attr({
                id: 'edit-window-fetchall',
                class: 'btn btn-primary edit-window-routine'
            })
            .on('click', function() {
                data.getTweets({
                    limit: 10000,
                    distinct: 1,
                    rumor_id: data.rumor.ID,
                    csv: ''
                });
            })
            .html('<span class="glyphicon glyphicon-download-alt"></span> All');
    },
    editWindowChanged: function() {
        // Indicate that the collection is to be updated
        d3.select('#edit-window-save')
            .attr('class', 'btn btn-primary');

        // Disable Match/Fetch buttons
        d3.selectAll('.edit-window-routine')
            .attr('disabled', '');
    },
};