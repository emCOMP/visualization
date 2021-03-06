String.prototype.hashCode = function () {
    var hash = 0, i, chr, len;
    if (this.length === 0) { return hash; }
    for (i = 0, len = this.length; i < len; i++) {
        chr   = this.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

var util = {
    formatDate: d3.time.format("%Y-%m-%d %H:%M:%S"),
    formatDateToMinutes: d3.time.format("%Y-%m-%d %H:%M"),
    formatDateToYMD: d3.time.format("%Y-%m-%d"),
    formDate: function(d) { return util.formatDate(new Date(new Date(new Date(d).setSeconds(0)).setMilliseconds(0))).replace(' ', 'T'); },
    date2monthstr: d3.time.format("%Y-%m"),
    date: function(str) {
        return util.formatDate.parse(str);
    },
    simplify: function(str) {
        return "l" + str.replace(/\W/g, '_');
    },
    compareCollections: function(a, b) {
        return util.compareDates(new Date(a.StartTime), new Date(b.StartTime));
    },
    compareSeries: function(a, b) {
        if(a.sum !== undefined && b.sum !== undefined)
            return b.sum - a.sum;
        return a.order - b.order;
    },
    compareDates: function(a, b) {
        if(a < b) 
            return -1;
        if(a > b)
            return 1;
        return 0;
    },
    lunique: function(list) {
        return Array.from(new Set(list)).sort();
    },
    lunion: function(A, B) {
        return [...new Set([...A, ...B])];
    },
    lintersect: function(A, B) {
        B = new Set(B);
        return A.filter(e => B.has(e));
    },
    ldiff: function(A, B) {
        B = new Set(B);
        return A.filter(e => !B.has(e));
    },
    range: function(length) {
        var arr = [];
        for(var i = 0; i < length; i++) {
            arr.push(i);
        }
        return arr;
    },
    zeros: function(length, width) { // just initialize a 1D or 2D matrix filled with zeros like in Matlab
        if(!width) {
            return d3.range(length).map(d => 0);
        } else {
            return d3.range(length).map(function() { 
                return d3.range(width).map(d => 0);
            });
        }
    },
    lshift: function(num, bits) {
        return num * Math.pow(2, bits);
    },
    rshift: function(num, bits) {
        return num / Math.pow(2, bits);
    },
    mod: function(num, base) {
        return (num % base + base) % base; // Fixes problems cause by modding negative numbers in Javascript
    },
    twitterID2Timestamp: function(ID) {
        return new Date(util.rshift(ID, 22) + 1288834974657);
    },
    timestamp2TwitterID: function(date) {
        return util.lshift(date.getTime() - 1288834974657, 22);
    },
    formatThousands: function(value) {
        var res = value < 0 ? '-' : '';
        value = Math.abs(value);
        for (var i = Math.floor(Math.log10(value)); i >= 0; i--) {
            res += Math.floor(value / Math.pow(10, i));
            if(i % 3 == 0 && i != 0)
                res += ' ';
            value = value % Math.pow(10, i);
        }
        return res;
    },
    formatMinutes: function(value) {
        return util.formatTimeCount(value * 60, 'm');
//        var days = Math.floor(value / 60 / 24);
//        var hours = Math.floor(value / 60) % 24;
//        var minutes = Math.floor(value % 60);
//        if(days) return days + 'd ' + (hours < 10 ? '0' : '') + hours + 'h ' + (minutes < 10 ? '0' : '') + minutes + 'm';
//        if(hours) return hours + 'h ' + (minutes < 10 ? '0' : '') + minutes + 'm';
//        return minutes + 'm';
    },
    formatDays: function(value) {
        return util.formatTimeCount(value * 24 * 60 * 60, 'd');
        
//        var years = Math.floor(value / 365);
//        var months = Math.floor((value - years * 365) / 30);
//        var days = Math.floor(value - years * 365 - months * 30);
//        if(years) return years + 'Y ' + (months < 10 ? '0' : '') + months + 'M ' + (days < 10 ? '0' : '') + days + 'd';
//        if(months) return months + 'M ' + (days < 10 ? '0' : '') + days + 'd';
//        return days + 'd';
    },
    formatTimeCount: function(seconds, smallest_quant) {
        smallest_quant = smallest_quant || 's';
        var sign = seconds < 0 ? -1 : 1;
        seconds *= sign;
        var vals = [];
        var units = ['y', 'mo', 'd', 'h', 'm', 's'];
        smallest_quant = units.indexOf(smallest_quant);
        vals.push(Math.floor(seconds / 365 / 24 / 60 / 60));
        seconds -= vals[0] * 365 * 24 * 60 * 60;
        vals.push(Math.floor(seconds / 30 / 24 / 60 / 60));
        seconds -= vals[1] * 30 * 24 * 60 * 60;
        vals.push(Math.floor(seconds / 24 / 60 / 60));
        seconds -= vals[2] * 24 * 60 * 60;
        vals.push(Math.floor(seconds / 60 / 60));
        seconds -= vals[3] * 60 * 60;
        vals.push(Math.floor(seconds / 60));
        seconds -= vals[4] * 60;
        vals.push(Math.floor(seconds));
        seconds -= vals[5];
        
        var formatted = [];
        vals.forEach(function(val, i) {
            if((val > 0 || formatted.length > 0) && i <= smallest_quant) {
                formatted.push(val + units[i]);
            }
        });
        if(formatted.length == 0) formatted.push('0' + units[smallest_quant]);
        return (sign == -1 ? '-' : '') + formatted.join(' ');
    },
    deformatMinutes: function(minutes) {
        return minutes.split(' ').reduce(function(res, cur) {
            if(cur.slice(-1) == 'd')
                return res + parseInt(cur.slice(0, -1)) * 24 * 60;
            if(cur.slice(-1) == 'h')
                return res + parseInt(cur.slice(0, -1)) * 60;
            if(cur.slice(-1) == 'm')
                return res + parseInt(cur.slice(0, -1));
            return 0;
        }, 0);
    },
    subsetName: function(args) {
        var feature = args.feature || args.Feature;
        var match = args.match || args.Match;
        
        if(match == undefined || match == 'null') 
            return '<em>None</em>'
            
        if(feature.includes('Text')) {
            match = match.replace(/\\W/g, '<span class="match_addon">_</span>');
        }
        if(match.includes('&')) {
            match = match.split(/ ?& ?/).map(function(term) {
                return util.subsetName({
                    feature: feature,
                    match: term
                }); 
            }).join('<span class="match_addon"> and </span>');
        } else if(match.includes('|')) {
            match = match.split('|').map(function(term) {
                return util.subsetName({
                    feature: feature,
                    match: term
                }); 
            }).join('<span class="match_addon"> or </span>');
        } else if(match.charAt(0) == '!' && feature != 'Text') {
            match = '<span class="match_addon not">not </span>' + util.subsetName({feature: feature, match: match.slice(1)});
        } else if(feature.includes('UTC')) {
            var hours = parseFloat(match) / 60 / 60;
            match = '' + (hours >= 0 ? '+' : '-');
            hours = Math.abs(hours);
            match +=
                (hours < 10 ? '0' : '') +
                hours.toFixed(0) + ':' +
                (hours * 6 % 6).toFixed(0) + (hours * 60 % 10).toFixed(0);
            
            // Have to figure this out relative to daylight saving times
//            if(match == '-08:00') match += ' <small>US Pacific</small>';
//            if(match == '-07:00') match += ' <small>US Mountain</small>';
//            if(match == '-06:00') match += ' <small>US Central & Mexico</small>';
//            if(match == '-05:00') match += ' <small>US Eastern & Andes</small>';
//            if(match == '-03:00') match += ' <small>Brazil, Argentina</small>';
//            if(match == '+00:00') match += ' <small>United Kingdom</small>';
//            if(match == '+01:00') match += ' <small>Europe</small>';
//            if(match == '+02:00') match += ' <small>Eastern Europe</small>';
//            if(match == '+03:00') match += ' <small>Russia</small>';
        } else if(feature.includes('Lang')) {
            if(match in util.langs) {
                return util.langs[match];
            }
        } else if (feature.includes('URL') && match.includes('.')) {
            match = '<a href=' + match + ' target="_blank">' + match + '</a>';
        } else if(feature.includes('Timestamp') || feature.includes('Time Posted (PT)') || feature.includes('Created At')) {
            if(typeof(match) == 'string' && !isNaN(match)) {
                match = util.formatDateToMinutes(new Date(parseInt(match)));
            } else if(typeof(match) == 'number') {
                match = util.formatDateToMinutes(new Date(match));
            }
        } else if(feature.includes('Creation Date')) {
            if(typeof(match) == 'string' && !isNaN(match)) {
                match = util.formatDateToYMD(new Date(parseInt(match)));
            } else if(typeof(match) == 'number') {
                match = util.formatDateToYMD(new Date(match));
            }
        } else if(feature.includes('Age')) {
            if(typeof(match) == 'string' && !isNaN(match)) {
                match = util.formatDays(parseInt(match));
            } else if(typeof(match) == 'number') {
                match = util.formatDays(match);
            }
        } else if(feature.includes('Verified')) {
            match = ['Unverified', 'Verified'][match];
        } else if(feature.includes('Distinct')) {
            match = ['Repeat', 'Distinct'][match];
        }
        
        if(args.includeFeature) {
            return '<small>' + feature + '</small>: ' + match;
        }
        return match;
    },
    URL2Domain: function(url) {
        if(url.includes('.co.')) {
            url = url.replace(/.*:\/\/([^\/]*\.)*([^\/]*)\.co\.([a-z]*)(\/.*|$)/i, '$2.co.$3');
        } else {
            url = url.replace(/.*:\/\/([^\/]*\.)*([^\/]*)\.([a-z]*)(\/.*|$)/i, '$2.$3');
        }
        url = url.toLowerCase();
        
        if(url in util.shortenedDomains) {
            url = util.shortenedDomains[url];
        }
        
        return url;
    },
    copyObject: function(object) {
        return JSON.parse(JSON.stringify(object));
    },
    langs: {
        'fr': 'French',
        'en': 'English',
        'ar': 'Arabic',
        'ja': 'Japanese',
        'es': 'Spanish',
        'de': 'German',
        'it': 'Italian',
        'id': 'Indonesian',
        'pt': 'Portuguese',
        'ko': 'Korean',
        'tr': 'Turkish',
        'ru': 'Russian',
        'nl': 'Dutch',
        'fil': 'Filipino',
        'msa': 'Malay',
        'zh-tw': 'Traditional Chinese',
        'zh-cn': 'Simplified Chinese',
        'hi': 'Hindi',
        'no': 'Norwegian',
        'sv': 'Swedish',
        'fi': 'Finnish',
        'da': 'Danish',
        'pl': 'Polish',
        'hu': 'Hungarian',
        'fa': 'Persian',
        'he': 'Hebrew',
        'th': 'Thai',
        'uk': 'Ukrainian',
        'cs': 'Czech',
        'ro': 'Romanian',
        'en-gb': 'British English',
        'vi': 'Vietnamese',
        'bn': 'Bengali',
        'und': '<em>Undetermined</em>',
        // End languages that are officially supported by Twitter 2016-04-15
        // Start languages published in https://blog.twitter.com/2015/evaluating-language-identification-performance
        'am': 'Amharic',
        'bg': 'Bulgarian', 
        'bo': 'Tibetan', 
        'bs': 'Bosnian', 
        'ca': 'Catalan', 
        'ckb': 'Sorani Kurdish', 
        'cy': 'Welsh', 
        'dv': 'Maldivian', 
        'el': 'Greek',  
        'et': 'Estonian', 
        'eu': 'Basque', 
        'gu': 'Gujarati', 
        'hi-Latn': 'Latinized Hindi', 
        'hr': 'Croatian', 
        'ht': 'Haitian Creole', 
        'hy': 'Armenian', 
        'is': 'Icelandic',
        'ka': 'Georgian', 
        'km': 'Khmer', 
        'kn': 'Kannada', 
        'lo': 'Lao', 
        'lt': 'Lithuanian', 
        'lv': 'Latvian', 
        'ml': 'Malayalam', 
        'mr': 'Marathi', 
        'my': 'Burmese', 
        'ne': 'Nepali',
        'pa': 'Panjabi', 
        'ps': 'Pashto', 
        'sd': 'Sindhi', 
        'si': 'Sinhala', 
        'sk': 'Slovak', 
        'sl': 'Slovenian', 
        'sr': 'Serbian', 
        'ta': 'Tamil', 
        'te': 'Telugu', 
        'tl': 'Tagalog', 
        'ug': 'Uyghur',  
        'ur': 'Urdu', 
        // Start manually added because they appeared but weren't in official documentation
        // I think in = indian which of course is not a language
        'es-mx': 'Mexican Spanish',
        'en-au': 'Australian Spanish',
        'ga': 'Irish', // Gaelic, but Gaelic is actually gd
        'gl': 'Galician',
        'fr-ca': 'Quebecois',
        'pt-pt': 'Portuguese Portuguese',
        'nb': 'Norwegian Bokmal',
        'select lan': 'Non-specified by User',
        'sélectionn': 'Non-specified by User 2',
        'in': 'Indonesian 2', // Old annotation
        'iw': 'Hebrew', // Old annotation
        'zh': 'Chinese',
        'en-in': 'Indian English',
        'ms': 'Malay',
        'mn': 'Mongolian',
        'en-us': 'United States English',
        'af': 'Afrikaans',
        'zh-hant': 'Traditional Chinese 2',
        'zh-hans': 'Simplified Chinese 2',
        'zh-hk': 'Hong-Kong Chinese',
        'lolc': 'LOLCat (Synthetic)',
        'xx-lc': 'LOLCat (Synthetic) 2', // I think
        'pt-br': 'Brazilian Portuguese',
        // Additional chinese codes may be listed here: https://www.w3.org/International/articles/bcp47/
    },
    stopwords: new Set(['the', 'a', 'an', 'that', 'this',
                'rt', 'via', 'com', 'www',
                'in', 'on', 'to', 'of', 'at', 
                'for', 'with', 'about', 'by', 'from',
                'is', 'are', 'be', 'was', 'have', 'has', 'will',
                'i', 'you', 'he', 'she', 'it', 'we', 'they',
                'me', 'him', 'her', 'us', 'them', 
                'my', 'your', 'his', 'its', 'our', 'their',
                'and', 'or',
                'as', 'if', 'so',
                'de', 'en', 'und', 'la',
                'how', 'what', 'when', 'where', 'who']),
    shortenedDomains: {
        'youtu.be': 'youtube.com',
        'fb.me': 'facebook.com',
        'wp.me': 'wordpress.com',
        'b4in.com': 'beforeitsnews.com',
        'b4in.info': 'beforeitsnews.com',
        'ind.pn': 'independent.co.uk',
        'presstv.info': 'presstv.com',
        'ptv.io': 'presstv.com',
        'wapo.st': 'washingtonpost.com',
        'wpo.st': 'washingtonpost.com',
        'goo.gl': 'google.com',
        'ln.is': 'linkis.com',
        'f24.my': 'france24.com',
        'bloom.bg': 'bloomberg.com',
        'ln.is': 'linkis.com',
        'reut.rs': 'reuters.com',
        'ift.tt': 'ifttt.com',
        'lnkd.in': 'linkedin.com',
        'dtv.to': 'po.st',
        'nyti.ms': 'nytimes.com',
        'tmblr.co': 'tumblr.com',
        'j.mp': 'bitly.com',
        'bit.ly': 'bitly.com',
        'ht.ly': 'bitly.com',
        'wh.gov': 'whitehouse.gov',
        'shr.lc': 'shareaholic.com',
        'fxn.ws': 'foxnews.com',
        'dailym.ai': 'dailymail.co.uk',
        'abcn.ws': 'absnews.com',
        'nydn.us': 'nydailynews.com',
        'huff.to': 'huffingtonpost.com',
        'huffpost.com': 'huffingtonpost.com',
        'apne.ws': 'apnews.com',
        'nbcnews.to': 'nbcnews.com',
        'every.tw': 'bitly.com',
        'cbsn.ws': 'cbsnews.com',
        'nyp.st': 'nypost.com',
        'lat.ms': 'latimes.com',
        'usat.ly': 'usatoday.com',
        'ti.me': 'time.com',
        'kng5.tv': 'king5.com',
        'trib.in': 'bitly.com',
        'twib.in': 'twibble.io',
        'thkpr.gs': 'thinkprogress.org',
        'thesent.nl': 'orlandosentinel.com',
        'thebea.st': 'thedailybeast.com',
        'politi.co': 'politico.com',
        'owl.li': 'ow.ly',
        'n.pr': 'npr.com',
        'bbc.in': 'bbc.co.uk',
        'bbc.com': 'bbc.co.uk',
    },
}

function Counter() {
    this.counts = new d3.map();
    this.tokens = 0;
    this.total_count = 0;
    this.not_applicable = 0;
}
Counter.prototype = {
    has: function(key) {
        return this.counts.has(key) || false;
    },
    get: function(key) {
        return this.counts.get(key) || 0;
    },
    set: function(key, val) {
        //TODO add tokens/total_count setter
        this.counts.set(key, val);
    },
    decr: function(key) {
        this.incr(key, -1);
    },
    incr: function(key, add) {
        add = add || 1;
        var val = this.counts.get(key) || 0;
        if(val != 0 && val + add == 0) { // Properly add or remove tokens
            this.tokens--;
        } else if(val == 0 && val + add != 0) {
            this.tokens++;
        }
        
        this.total_count += add;
        
        this.counts.set(key, val + add);
    },
    cmpCount: function(a, b) {
        if(a.value == b.value)
            return a.key.localeCompare(b.key);
        return b.value - a.value
    },
    top: function(k) {
        return this.top_nlogn(k);
    },
    top_nk: function(k) { // O(nk)
        k = k || 10; // default 10
        
        var top = d3.range(k).map(function() {
            return {key: "", value: 0};
        })
        var minVal = 0;
        var moreThanMin = 0;
        this.counts.forEach(function(key, val) {
            // If it is bigger than a candidate
            if(minVal < val) {
                if(moreThanMin >= k - 1)
                    top = top.filter(d => d.value > minVal);
                top.push({
                    key: key,
                    value: val
                });
                minVal = d3.min(top, d => d.value);
                moreThanMin = top.filter(d => d.value > minVal).length;
            } else if(minVal == val) {
                top.push({
                    key: key,
                    value: val
                });
            }
        });
        
        return this.firstK(this.getSorted(top), k)
    },
    top_nlogn: function(k) { // O(nlogn)
        k |= 10; // default 10
        
        return this.firstK(this.getSorted(), k);
    },
    top_no_stopwords: function(k) {
        k |= 10; // default 10
        
        var entries = this.counts.entries().filter(function(d) {
            return !d.key.split(' ').reduce(function(found, word) {
                return found || util.stopwords.has(word);
            }, false);
        }, this);
        return this.firstK(this.getSorted(entries), k)
    },
    getSorted: function(arr) {
        if(!arr)
            arr = this.counts.entries();
        arr.sort(this.cmpCount)
        return arr;
    },
    firstK: function(arr, k) {
        if(!arr)
            arr = this.counts.entries();
        k |= 10; // default 10
        k = Math.min(k, arr.length);
        
        var res = [];
        for(var i = 0; i < k; i++)
            res.push(arr[i]);
        return res;
    },
    purgeBelow: function(minimum, add_rare) { 
        if(add_rare == undefined) add_rare = true;
        if(minimum) {
            var self = this;
            this.counts.forEach(function(key, val) {
                if(val < minimum) {
                    this.remove(key);
                    if(add_rare)
                        self.incr("<em>Rare</em>", val);
                }
            });
            var old_count = this.tokens;
            this.tokens = this.counts.size();
            return old_count - this.tokens; // number removed
        } else { // Halves the size of the array
            var sorted = this.getSorted();
            minimum = sorted[sorted.length / 2].value + 1;

            sorted.forEach(function(entry) {
                if(entry.value < minimum) {
                    this.counts.remove(entry.key);
                    if(add_rare)
                        this.incr("<em>Rare</em>", entry.value);
                }
            }, this);
            var old_count = this.tokens;
            this.tokens = this.counts.size();
            return old_count - this.tokens; // number removed
        }
    },
    statistics: function(verbose) { // presuming numeric keys
        var stats = {};
        
        var entries = this.counts.entries();
        entries.sort((a, b) => parseFloat(a.key) - parseFloat(b.key));
        if(verbose) console.log(entries);
        
        // Quartiles
        var quartile_labels = ['Minimum', '25<sup>th</sup> Quartile', 'Median', '75<sup>th</sup> Quartile', 'Maximum'];
        var current_quartile = 0;
        var partial_n = 0;
        var n = this.total_count;
        entries.forEach(function(d) {
            partial_n += d.value;
            while((current_quartile * .25) <= (partial_n / n) &&
                  current_quartile < 5) {
                stats[quartile_labels[current_quartile]] = d.key;
                current_quartile++;
            }
        });
        
        // Distribution quantities
        var n = 0;
        var weighted_sum = 0;
        var sum_squares = 0;
        entries.forEach(function(d) { // Average & Stdev
            var x =  parseFloat(d.key);
            n += d.value;
            weighted_sum += x * d.value; // value == count in this case
            sum_squares += x * x * d.value;
        });
        var mean = weighted_sum / n;
        
//        var ave_cube_diff = 0;
//        var ave_quad_diff = 0;
//        entries.forEach(function(d) { // 
//            var x =  parseInt(d.key);
//            ave_cube_diff += Math.pow(x - mean, 3) * d.value / n;
//            ave_quad_diff += Math.pow(x - mean, 4) * d.value / n;
//        });
        
        stats['Mean'] = mean;
        stats['Stdev'] = Math.sqrt((sum_squares / n) - (weighted_sum / n) * (weighted_sum / n));
//        stats['Skewness'] = ave_cube_diff / Math.pow(stats['Stdev'], 3);
//        stats['Kurtosis'] = ave_quad_diff / Math.pow(stats['Stdev'], 4) - 3;
        
        return stats;
    },
};

function Connection(args) {
    var permitted_args = ['name', 'url', 'post', 'resolution', 'time_res',
                          'progress_div', 'progress_text', 'progress_style',
                          'quantity', 'min', 'max',
                          'failure_msg',
                          'on_chunk_finish', 'on_finish', 'on_timeout',
                          'pk_query', 'pk_table'];

    // Save args  
    if(args) {
        Object.keys(args).forEach(function (item) {
            if(permitted_args.includes(item)) {
                this[item] = args[item];
            }
        }, this);
    }
    
    // Defaults
    this.name            = this.name            || 'r' + Math.floor(Math.random() * 1000000 + 1);
    this.url             = this.url             || "";
    this.post            = this.post            || {};
    this.resolution      = this.resolution || this.time_res        || 1; // 1 Hour
    
    this.progress        = {};
    this.progress_div    = this.progress_div    || '#body';
    this.progress_text   = this.progress_text   || "Working";
    this.progress_style  = this.progress_style  || 'pagemiddle';
    
    this.quantity        = this.quantity        || 'tweet';
    this.useOffset       = this.useOffset == undefined ? true : this.useOffset;
    this.chunks          = [];
    this.chunk_index     = 0;
    this.min             = this.min             || 0;
    this.max             = this.max             || new Date();
    this.lastTweet       = 0;
    this.pk_query        = this.pk_query        || 'tweet_min'; // Primary key of the PHP query for streaming
    this.pk_table        = this.pk_table        || 'ID';
    
    this.failure_msg     = this.failure_msg     || 'Problem with data stream';
    this.on_chunk_finish = this.on_chunk_finish || function () {};
    this.on_finish       = this.on_finish       || function () {};
    this.on_timeout      = this.on_timeout      || function (errorMsg) {
        console.error('Timeout', errorMsg, this.post);
        triggers.emit('alert', 'Timeout. Check console error log for details.');
        this.progress.end();
    }.bind(this);
    
    // Convert min & max to dates if they are inputted as tweets
    if(this.quantity != 'count') {
        if(typeof(this.min) == 'number' || typeof(this.min) == 'string') {
            this.min = util.twitterID2Timestamp(this.min);
        } else if(this.min instanceof BigNumber) {
            this.min = util.twitterID2Timestamp(this.min.toNumber());
        }
        this.min.setMinutes(0); // Round to the nearest minute
        this.min.setSeconds(0); 
        this.min.setMilliseconds(0); 
        if(typeof(this.max) == 'number' || typeof(this.max) == 'string') {
            this.max = util.twitterID2Timestamp(this.max);
        } else if(this.max instanceof BigNumber) {
            this.max = util.twitterID2Timestamp(this.max.toNumber());
        }
        // Add one more tick to max so we can get the last #
        this.max.setMinutes(this.max.getMinutes() + 60 * this.resolution)
    }
}
Connection.prototype = {
    php: function(url, fields, callback, error_callback) {
        if(!fields)
            fields = {};
        if(!callback)
            callback = function() {};
        if(!error_callback)
            error_callback = function() {};
        
        $.ajax({
            url: 'src/php/' + url + '.php',
            type: "POST",
            data: fields,
            cache: false,
            success: callback,
            error: error_callback
        });
    },
    phpjson: function(url, fields, callback, error_callback) {
        if(!error_callback)
            error_callback = function() {};
        
        var json_callback = function(raw_data) {
            var json_data;
            try {
                json_data = JSON.parse(raw_data);
            } catch(err) {
                console.error('JSON parsing error for ' + url, fields, err, raw_data);
                error_callback(raw_data);
                return;
            }
            callback(json_data);
        };
        
        this.php(url, fields, json_callback, error_callback);
    },
    startStream: function () {
        this.chunks = [];
        this.chunk_index = 0;
        
        // Get chunk intervals
        if(this.quantity == 'count') {
            for(var cur = this.min; 
                cur < this.max;
                cur += this.resolution) {
                
                this.chunks.push(cur);
            }

            // Add last bound (the max)
            this.chunks.push(this.max);
        } else {
            for(var cur = new Date(this.min); 
                cur < this.max;
                cur.setMinutes(cur.getMinutes() + 60 * this.resolution)) {

                if(this.quantity == 'tweet') {
                    this.chunks.push(util.timestamp2TwitterID(cur));
                } else {
                    this.chunks.push(util.formatDate(cur));
                }
            }

            // Add last bound (the max)
            if(this.quantity == 'tweet') {
                this.chunks.push(util.timestamp2TwitterID(this.max));
            } else {
                this.chunks.push(util.formatDate(this.max));
            }
        }

        // Start progress bar
        var progress_text = this.progress_text;
        if(this.quantity == 'count') {
            progress_text = progress_text.replace('{cur}', this.chunks[this.chunk_index]);
            progress_text = progress_text.replace('{max}', this.max);  
        } else {
            progress_text = progress_text.replace('{cur}', util.formatDate(util.twitterID2Timestamp(this.chunks[this.chunk_index])));
            progress_text = progress_text.replace('{max}', util.formatDate(this.max));  
        }
        this.progress = new Progress({
            name:      this.name,
            parent_id: this.progress_div,
            style:     this.progress_style,
            text:      progress_text,
            steps:     this.chunks.length - 1
        });
        this.progress.start();

        this.startChunk();
    },
    startChunk: function () {
        // If we are at the max, end
        if (this.chunk_index >= this.chunks.length - 1) {
            // Load the new data
            this.on_finish();

            // End the progress bar and stop function
            this.progress.end();
            return;
        } else if(this.chunk_index < 0) {
            // End prematurely
            this.progress.end();
            return;
        } else if (this.chunk_index == this.chunks.length - 2) { // This is the LAST chunk
            this.post['inclusive_max'] = true;
        }

        // Define what it's loading
        if(this.quantity == 'count') {
            this.post['limit'] = this.resolution;
            if(this.useOffset) {
                this.post['offset'] = this.chunks[this.chunk_index];
            } else if(this.lastTweet) {
                if(this.lastTweet instanceof BigNumber) {
                    this.post[this.pk_query] = this.lastTweet.add(1).toString();
                } else if(this.lastTweet instanceof Date) {
                    var nextDate = new Date(this.lastTweet);
                    nextDate.setSeconds(nextDate.getSeconds() + 1);
                    this.post[this.pk_query] = util.formatDate(nextDate);
                } else {
                    this.post[this.pk_query] = (this.lastTweet + 1) + "";
                }
                console.log(this.post, this.post[this.pk_query]);
            }
        } else {
            this.post[this.quantity + '_min'] = this.chunks[this.chunk_index];
            this.post[this.quantity + '_max'] = this.chunks[this.chunk_index + 1];
        }

        if(this.post.json) {
            this.phpjson(this.url, this.post,
                         this.chunk_success.bind(this),
                         this.chunk_failure.bind(this));
        } else {
            this.php(this.url, this.post,
                         this.chunk_success.bind(this),
                         this.chunk_failure.bind(this));
        }
    },
    chunk_success: function (file_data) {
        if (file_data.includes('<b>Notice</b>') || file_data.includes('<b>Error</b>') || file_data.includes('<b>Parse error</b>')) {
            console.debug(file_data);

            // Abort
            this.chunk_failure();
            return;
        }

        // Update the progress bar
        var progress_text = this.progress_text;
        if(this.quantity == 'count') {
            progress_text = progress_text.replace('{cur}', this.chunks[this.chunk_index + 1]);
            progress_text = progress_text.replace('{max}', this.max);  
        } else {
            progress_text = progress_text.replace('{cur}', util.formatDate(util.twitterID2Timestamp(this.chunks[this.chunk_index])));
            progress_text = progress_text.replace('{max}', util.formatDate(this.max));  
        }
        this.progress.update(this.chunk_index + 1, progress_text);

        if(this.quantity == 'count' && !this.useOffset)  { // Makes a LOT of assumptions about the data
            if(this.post.json && file_data[file_data.length - 1]) {
                this.lastTweet = file_data[file_data.length - 1][this.pk_table];
                if(this.pk_query.includes('time')) 
                    this.lastTweet = util.date(this.lastTweet);
                else if(this.pk_query.includes('tweet')) 
                    this.lastTweet = new BigNumber(this.lastTweet);
                else 
                    this.lastTweet = parseInt(this.lastTweet);
            } else {
                var lastTweetStart = file_data.lastIndexOf(this.pk_table + ':"');
                if(lastTweetStart >= 0) {
                    this.lastTweet = file_data.slice(lastTweetStart + 6, lastTweetStart + 24);
                    if(this.pk_query.includes('tweet')) this.lastTweet = new BigNumber(this.lastTweet);
                }
            }
        }
        this.on_chunk_finish(file_data);

        // Start loading the next batch
        this.chunk_index = this.chunk_index + 1;
        this.startChunk();
    },
    chunk_failure: function (error, status, statusText) {
        if(error && error.includes && (error.includes('Maximum execution time') || error.includes('Gateway Time-out'))) {
            this.on_timeout(error);
        } else {
            console.error('Error in PHP request', statusText, this.url, this.post, error, status);
            triggers.emit('alert', this.failure_msg);
            this.progress.end();
        }
    },
    stop: function() {
        this.chunk_index = -100;
    }
};
standardConnections = {
    genInCombinedEvent: function(event, new_event, tweet_min, tweet_max) {
        var connection = new Connection({
            url: 'analysis/genInCombinedEvent',
            post: {event: event, new_event: new_event}, 
            min : tweet_min, 
            max: tweet_max,
            progress_text: '{cur} / {max}',
            on_chunk_finish: function(d) { 
                console.log(d + ' Tweets Added');
            }});
        
        connection.startStream();
        return connection;
    },
    genInSubset: function(post, tweet_min, tweet_max) {
        if(!tweet_min) {
            // If the user doesn't provide an minimum tweet (or a max)
            // and we are in the status report, we can get it from the event list
            if('event' in post && SR) { 
                var event = SR.events[post.event];
                tweet_min = event['FirstTweet'];
                tweet_max = event['LastTweet'];
            } else if('superset' in post && SR) { 
                var subset = SR.subsets[post.superset];
                tweet_min = subset['FirstTweet'];
                tweet_max = subset['LastTweet'];
            } else {
                console.error("need to provide minimum tweet");
            }
        }
        
        var connection = new Connection({
            url: 'analysis/genInSubset',
            post: post,
            min : tweet_min, 
            max: tweet_max,
            progress_text: '{cur} / {max}',
            on_chunk_finish: function(d) { 
                if(d.includes(':') && !d.includes('>:')) { // new subset id
                    post.subset = d.slice(0, d.indexOf(':'));
                }
                console.log(d);
            }});
        
        connection.startStream();
        return connection;
    },
    genUsers: function(event, subset, tweet_min, tweet_max, simple) {
        var post = {
            event: event,
            subset: subset || 0
        }
        if(!tweet_min) {
            if(subset && SR) {
                var subset = SR.subsets[subset];
                tweet_min = subset['FirstTweet'];
                tweet_max = subset['LastTweet'];
            } else if(SR) { 
                var event = SR.events[event];
                tweet_min = event['FirstTweet'];
                tweet_max = event['LastTweet'];
            } else {
                console.error("Need to provide event and/or minimum and maximum tweet id");
            }
        }
        
        var connection = new Connection({
            url: 'analysis/genUsers' + (simple ? 'Simple' : ''),
            post: post, 
            min : tweet_min, 
            max: tweet_max,
            resolution: 0.25,
            progress_text: '{cur} / {max}',
            on_chunk_finish: function(d) { 
                console.log('Signal(' + d + '), counting users for Event ' + event + (subset ? ', Subset ' + subset : ''));
            }});
        
        connection.startStream();
        return connection;
    },
    genInCluster: function(clustertype, superset, offset) {
        var conns = [];
        for(var i = 1; i <= 22; i++) {
            if(clustertype == 'Followship' && i > 10 && i <= 20) {
                continue;
            }
            var conn = standardConnections.genInSubset({
                superset: superset,
                subset: offset + i,
                usercluster: i,
                clustertype: clustertype,
            });
            
            conn.progress.container_div.style('top', (i / 23 * 100) + '%')
            conns.push(conn);
        }
        
        return conns;
    },
    genXLMTweetsInTimeLimitedGroups: function() {
        // Hardcoded for now, can be customized later
        var baseid = 2510;
        var nClusters = 15;
        var groups = [
//            {
//            id: 2525,
//            startdate: new Date('2016-07-01 00:00:00'),
//            enddate: new Date('2016-07-25 00:00:00')
//        },{
//            id: 2570,
//            startdate: new Date('2016-03-27 00:00:00'),
//            enddate: new Date('2016-04-06 00:00:00')
//        },
            {
            id: 2540,
            startdate: new Date('2016-09-10 00:00:00'),
            enddate: new Date('2016-10-04 00:00:00')
        },{
            id: 2555,
            startdate: new Date('2016-03-12 00:00:00'),
            enddate: new Date('2016-03-21 00:00:00')
        }];
        
        groups.forEach(function(group) {
            var start = util.timestamp2TwitterID(group.startdate) + "";
            var end = util.timestamp2TwitterID(group.enddate) + "";
            
            for (var i = 0; i < nClusters; i++) {
                standardConnections.genInSubset({subset:group.id + i, superset: baseid + i}, start, end);
            }
        });
    },
};

function SharedAudienceSuite() {
    this.connection = new Connection();
    this.users = false;
    this.adjacentUsers = false;
    this.edges = false;

    this.progress = false;
    this.stopped = true;
    
    this.nUsers = 0;
    this.iUser = 0;
    this.jUser = 0;

    this.nEdges = 0;
    this.iEdge = 0;
    this.edgeStream = false;
}
SharedAudienceSuite.prototype = {
    transferFollows: function() {
        // Get User List
        var connection = new Connection();
        connection.php('follows/getUserIDs', {}, function (userIDs) {
            userIDs = userIDs.split('\n');
            userIDs.shift(); // Remove the title
            userIDs.pop(); // Remove the last entry
            var nUsers = userIDs.length;
            var progress = new Progress({steps: nUsers});
            progress.start();
            var nConnections = 0;
            
            var transferUser = function(iUser) {
                var userID = userIDs[iUser];
                progress.update(iUser, 'Connections so far: ' + nConnections + '. Fetching ' + userID + ". ");
                // Get Follows from old table
                connection.php('follows/getFollows', {userID: userID},//, following: 1},
                    function(followers) {
                        followers = followers.split('\n');
                        followers.shift(); // Remove the title
                        followers.pop(); // Remove the last entry
                        if(followers.length > 0) {
                            nConnections = nConnections + followers.length;
                            
                            // Handle problem if there are too many followers to push (it will crowd the php)
                            if(followers.length > 25000) {
                                console.info('User has too many followers, sending slices of their follower list', userID, followers.length);
                            }
                            
                            while (followers.length > 25000) {
                                var followers_slice = followers.slice(0, 25000).join(',');
                                followers = followers.slice(25000);
                                
                                connection.php('follows/addFollows', 
                                    {userID: userID, followers: followers_slice},//, following: 1},
                                    function(result) {
                                        console.log(result);
                                    });
                            }
                            
                            
                            followers = followers.join(',');
                            
                            progress.update(iUser, 'Connections so far: ' + nConnections + '. Sending  ' + userID + ". ");
                            
                            connection.php('follows/addFollows', 
                                {userID: userID, followers: followers},//, following: 1},
                                function(result) {
                                        console.log(result);
                                
                                    if(iUser < nUsers) {
                                        setTimeout(function() {
                                            transferUser(iUser + 1);
                                        }, 10);
                                    } else {
                                        progress.end();
                                        console.log('nConnections', nConnections);
                                    }
                                });
                        } else {
                            if(iUser < nUsers) {
                                setTimeout(function() {
                                    transferUser(iUser + 1);
                                }, 10);
                            } else {
                                progress.end();
                                console.log('nConnections', nConnections);
                            }
                        }
                    });
            };
            
            transferUser(0);
        });
    },
    computeFollowersRetrieved: function() {
        this.connection.phpjson('follows/getSharedAudienceUsers', {}, function (users) {
            this.users = users;
            this.nUsers = users.length;
            this.iUser = 0;
            this.progress = new Progress({steps: this.nUsers});
            this.progress.start();
            this.computeFollowersRetrieved_ForUser();
        }.bind(this));
    },
    computeFollowersRetrieved_ForUser: function() {
        var user = this.users[this.iUser];
        this.progress.update(this.iUser, 'Counting Followers Retrieved for User' + this.iUser + " (ID: " + user['UserID'] + ") ");
        this.connection.php('follows/countFollowersRetrieved',
                            {userID: user['UserID']},
                            computeFollowersRetrieved_ForUser_Result.bind(this));
    },
    computeFollowersRetrieved_ForUser_Result: function(followersRetrieved) {
        // Continue with next user
        if(this.iUser < this.nUsers -1) {
            this.iUser = this.iUser + 1;
            setTimeout(this.computeFollowersRetrieved_ForUser.bind(this), 1);
            
        } else {// Or we are done, wrap up
            this.progress.end();
        }
    },
    computePairwiseSharedAudience: function() {
        this.stopped = false;
        this.progress = new Progress();
        this.progress.start();
        
        this.progress.update(100, "Get User List");
        this.connection.phpjson('follows/getSharedAudienceUsers', {},
                                this.computePSA_ParseUsers.bind(this));
    },
    computePSA_ParseUsers: function(users) {
        this.users = users;
        this.nUsers = users.length;
        console.log('Compute Pairwise Shared Audience', 'Users: ', this.nUsers);
        this.progress.steps = this.nUsers * (this.nUsers - 1) / 2;

        // Initialize Adjacency List
        this.adjacentUsers = {};
        this.users.forEach(function(user) {
            this.adjacentUsers[user['UserID']] = new Set();
        }, this);
        
        // Start getting edges
        this.progress.update(0, "Get Existing Edge List");
        this.connection.phpjson('follows/getExistingEdges',
                                {'count': true},
                               this.computePSA_startEdgeStream.bind(this));
    },
    computePSA_startEdgeStream: function(result) {
        this.nEdges = parseInt(result[0]['nEdges']);
        console.log('Compute Pairwise Shared Audience', 'Existing edges: ', this.nEdges);
        this.edgeStream = new Connection({
            url: 'follows/getExistingEdges',
            post: {json: true},
            resolution: 1000,
            quantity: 'count',
            useOffset: true,
            max: this.nEdges,
            progress_text: '{cur}/{max} Existing Edges Retrieved',
            on_chunk_finish: this.computePSA_addEdgesInStream.bind(this),
            on_finish: this.computePSA_startUserPairStream.bind(this)
        });
        this.edgeStream.startStream();
    },
    computePSA_addEdgesInStream: function(edgelist) {
        console.log('Compute Pairwise Shared Audience', 'Adding edges: ', edgelist.length);
        edgelist.forEach(function(edge) {
            this.adjacentUsers[edge['UserID1']].add(edge['UserID2']);
        }, this);
    },
    computePSA_startUserPairStream: function() {
        this.iUser = 1;
        this.jUser = 0;
        this.iEdge = 0;
        
        this.computePSA_ForPair();
    },
    computePSA_ForPair: function() {
        var userA = this.users[this.iUser];
        var userB = this.users[this.jUser];
        
        this.progress.update(this.iEdge, "Counting SharedAudience between User " +
                             this.iUser + " (ID: " + userA['UserID'] + ") and User " +
                             this.jUser + " (ID: " + userB['UserID'] + ") ");
        
        // Swap to make sure user IDs are ascending
        if(new BigNumber(userA['UserID']) > new BigNumber(userB['UserID'])) {
            var userTemp = userA;
            userA = userB;
            userB = userTemp;
        }
        var existingEdge = this.adjacentUsers[userA['UserID']].has(userB['UserID']) ? 1 : 0;
        
        this.connection.php('follows/countPairwiseSharedAudience', {
                                userID1: userA['UserID'], 
                                userID2: userB['UserID'],
                                SumOfAudiences_Observed: parseInt(userA['FollowersRetrieved']) + parseInt(userB['FollowersRetrieved']),
                                userID1_Audience_Actual: userA['FollowersActual'],
                                userID2_Audience_Actual: userB['FollowersActual'],
                                correction1: userA['Correction100k'],
                                correction2: userB['Correction100k'],
                                existingEdge: existingEdge,
                            },
                            this.computePSA_ForPair_Result.bind(this));
        
    },
    computePSA_ForPair_Result: function(CorrectedWeight) {
        if(CorrectedWeight != undefined || CorrectedWeight != "") {
            this.iEdge_AboveThreshold = this.iEdge_AboveThreshold + 1;
            console.log(CorrectedWeight);
        }
        
        if(this.stopped) {
            this.progress.end();
            return;
        }
    
        // If we are finished with this user (no more other users to pair with
        if(this.jUser == 0) {
            if(this.iUser >= this.nUsers - 1) {
                // There are no more users, wrap up
                this.progress.end();
                return;
            }
            
            // Move to the next starting User
            this.jUser = this.iUser;
            this.iUser = this.iUser + 1;
            
            // && theorectically update the user saying we've counted them
        } else {
            // Next User!
            this.jUser = this.jUser - 1;
        }
        this.iEdge = this.iEdge + 1;
        setTimeout(this.computePSA_ForPair.bind(this), 5);
    },
    recomputePairwiseSharedAudience: function() {
        // For recalculing already calculated shared audience edges (IE not trying to find new ones)
        this.stopped = false;
        this.progress = new Progress();
        this.progress.start();
        
        this.progress.update(100, "Get User List");
        this.connection.phpjson('follows/getSharedAudienceUsers', {},
                                this.recomputePSA_ParseUsers.bind(this));
    },
    recomputePSA_ParseUsers: function(users) {
        this.nUsers = users.length;
        console.log('Compute Pairwise Shared Audience', 'Users: ', this.nUsers);
        
        // Make users a dictionary (as opposed to an array)
        this.users = {}
        users.forEach(function(user) {
            this.users[user['UserID']] = user;
        })
        
        // Start getting edges
        this.progress.update(0, "Get Existing Edge List");
        this.connection.phpjson('follows/getExistingEdges',
                                {'count': true},
                               this.recomputePSA_startEdgeStream.bind(this));
    },
    recomputePSA_startEdgeStream: function(result) {
        this.edges = [];
        this.nEdges = parseInt(result[0]['nEdges']);
        this.progress.steps = this.nEdges;
        console.log('Compute Pairwise Shared Audience', 'Existing edges: ', this.nEdges);
        
        this.edgeStream = new Connection({
            url: 'follows/getExistingEdges',
            post: {json: true},
            resolution: 1000,
            quantity: 'count',
            useOffset: true,
            max: this.nEdges,
            progress_text: '{cur}/{max} Existing Edges Retrieved',
            on_chunk_finish: this.recomputePSA_addEdgesInStream.bind(this),
            on_finish: this.recomputePSA_startUserPairStream.bind(this)
        });
        this.edgeStream.startStream();
    },
    recomputePSA_addEdgesInStream: function(edgelist) {
        console.log('Compute Pairwise Shared Audience', 'Adding edges: ', edgelist.length);
        edgelist.forEach(function(edge) {
            this.edges.push(edge);
        }, this);
    },
    recomputePSA_startUserPairStream: function() {
        this.iEdge = 0;
        
        this.recomputePSA_ForPair();
    },
    recomputePSA_ForPair: function() {
        var edge = this.edges[this.iEdge];
        var userA = this.users[edge['UserID1']];
        var userB = this.users[edge['UserID2']];
        
        this.progress.update(this.iEdge, "Counting SharedAudience # " + this.iEdge + 
                                         " between Users " + edge['UserID1'] + 
                                         " and " + edge['UserID2']);
        
        this.connection.php('follows/countPairwiseSharedAudience', {
                                userID1: userA['UserID'], 
                                userID2: userB['UserID'],
                                SumOfAudiences_Observed: parseInt(userA['FollowersRetrieved']) + parseInt(userB['FollowersRetrieved']),
                                userID1_Audience_Actual: userA['FollowersActual'],
                                userID2_Audience_Actual: userB['FollowersActual'],
                                correction1: userA['Correction100k'],
                                correction2: userB['Correction100k'],
                                existingEdge: true,
                            },
                            this.recomputePSA_ForPair_Result.bind(this));
        
    },
    recomputePSA_ForPair_Result: function(CorrectedWeight) {
        if(CorrectedWeight != undefined || CorrectedWeight != "") {
            console.log(CorrectedWeight);
        }
        
        if(this.stopped || this.iEdge >= this.nEdges - 1) {
            this.progress.end();
            return;
        }
        
        this.iEdge = this.iEdge + 1;
        setTimeout(this.recomputePSA_ForPair.bind(this), 5);
    },
    stop: function() {
        this.stopped = true;
        this.progress.end();
    }
};

function Tooltip() {
    this.div = {};
    this.info = {};
}
Tooltip.prototype = {
    init: function() {
        this.div = d3.select('body')
            .append('div')
            .attr('class', 'tooltip');
    },
    setData: function(new_data) {
        if(JSON.stringify(this.data) != JSON.stringify(new_data)) {
            // Clear & set new parameters
            this.data = new_data;
            this.div.selectAll('*').remove();

            if(typeof(new_data) == 'string') {
                this.div.classed('tooltip-string', true);
                
                this.div.append('p').html(new_data);
            } else { // Presuming object, the original tooltip
                this.div.classed('tooltip-string', false);
                
                // Create table (if this it is a table)
                var rows = this.div.append('table')
                    .selectAll('tr')
                    .data(Object.keys(new_data))
                    .enter()
                    .append('tr');

                rows.append('th')
                    .html(function(d) { return d + ":"; });

                rows.append('td')
                    .html(function(d) { 
                        if(Array.isArray(new_data[d]))
                            return new_data[d].join(', ');
                        return new_data[d];
                    });
            }
        }
    },
    on: function() {
        this.div
            .transition(200)
            .style('opacity', 1);
    },
    move: function(x, y) {
        var height = parseInt(this.div.style('height'));
        var pageHeight = document.documentElement.clientHeight;
        if(y + height > pageHeight) {
            y += pageHeight - (y + height)
        }
        
        this.div
            .style({
                left: x + 20 + "px",
                top: y + "px"
            });
    },
    off: function() {
        this.div
            .transition(200)
            .style('opacity', 0);
    },
    attach: function(id, data_transform) {
        d3.selectAll(id)
            .on('mouseover', function(d) {
                this.setData(data_transform(d))
                this.on();
            }.bind(this))
            .on('mousemove', function(d) {
                this.move(d3.event.x, d3.event.y);
            }.bind(this))
            .on('mouseout', function(d) {
                this.off();
            }.bind(this));
    }
};

function ContextMenu() {
    this.div = {};
    this.info = {};
    this.data = [];
}
ContextMenu.prototype = {
    init: function() {
        this.div = d3.select('body')
            .append('div')
            .attr('id', 'context-menu')
            .attr('class', 'tooltip dropdown clearfix')
            .style('pointer-events', 'auto')
            .style('display', 'none')
            .on('mouseover', function() {
                d3.event.stopPropagation();
            })
            .on('mousemove', function() {
                d3.event.stopPropagation();
            })
            .on('mouseout', function() {
                d3.event.stopPropagation();
            }); // menu frame
    },
    setData: function(options) {
        // Add close option
        options.push({divider: true});
        options.push({
            label: '<span class="glyphicon glyphicon-remove"></span> Close',
            action: this.off.bind(this)
        });
        
        // Clear & set new parameters
        this.data = options;
        this.div.selectAll('*').remove();

        var list = this.div.append('ul')
            .attr({
                role: 'menu',
                class: "dropdown-menu",
                'aria-labelledby': "dropdownMenu"
            })
            .style({
                display: 'block',
                'margin-bottom': '5px',
                'font-size': '1em'
            });
        
        list.selectAll('li')
            .data(options)
            .enter().append('li')
            .attr('class', option => option.divider ? 'divider' : 'menu-action');
        
        list.selectAll('li.menu-action')
            .append('a')
            .attr('tabindex', -1)
            .style('cursor', 'pointer')
            .html(option => option.label)
            .on('click', function(option) {
                d3.event.stopPropagation();
                if(option.action) {
                    option.action();
//                    this.off(); // automatically close it?
                }
            }.bind(this));
    },
    on: function() {
        this.div
            .transition(200)
            .style('opacity', 1)
            .style('display', 'block');
    },
    move: function(x, y) {
        var height = parseInt(this.div.style('height'));
        var pageHeight = document.documentElement.clientHeight;
        if(y + height > pageHeight) {
            y += pageHeight - (y + height)
        }
        
        this.div
            .style({
                left: x + 20 + "px",
                top: y + "px"
            });
    },
    off: function() {
        this.div
            .transition(200)
            .style('opacity', 0)
            .each('end', function(d) { 
                d3.select(this).style('display', 'none');
        });
    },
    attach: function(id, data_transform) {
        d3.selectAll(id)
            .on('contextmenu', function(data) {
                this.setData(data_transform(data))
                this.move(d3.event.x, d3.event.y);
                this.on();
                d3.event.preventDefault();
            }.bind(this));
    }
};

triggers = {
    verbose: false,
    events: {},
    on: function (eventName, fn) {
        this.events[eventName] = this.events[eventName] || [];
        this.events[eventName].push(fn);
    },
    off: function(eventName, fn) {
        if (this.events[eventName]) {
            for (var i = 0; i < this.events[eventName].length; i++) {
                if (this.events[eventName][i] === fn) {
                    this.events[eventName].splice(i, 1);
                    break;
                }
            };
        }
    },
    emit: function (eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(function(fn) {
                if(this.verbose)
                    console.log('Triggered: ' + eventName + '\nCall:      ' + fn.name);
                fn(data);
//                setTimeout(function() { fn(data); }, 1);
            }, this);
        }
    },
    emitter: function(eventName, parameter) {
        if(parameter)
            return function() { this.emit(eventName, parameter); }.bind(this);
        return function(d) { this.emit(eventName, d); }.bind(this);
    }
};
// Add first trigger
triggers.on('alert', function(ops) {
    // Manage options
    if(typeof(ops) == 'string'){
        ops = {text: ops};
    }
    if(!ops['style_class']) {
        ops['style_class'] = 'warning';
    }
    if(!ops['parent']) {
        ops['parent'] = 'body';
    }

    var style = {
        position: 'absolute',
        top: '50%',
        transform: 'translate(0%, -50%)',
        left: '20%',
        width: '60%',
        'z-index': 4
    }

    var alert_shadow = d3.select(ops['parent']).append('div')
        .attr('class', 'alert_outer')
        .style({
            'width': '100%',
            'height': '100%',
            'position': 'absolute',
            'top': 0,
            'left': 0
        })
        .on('click', function() {
            d3.select('.alert_outer').remove();
        });

    var alert_div = alert_shadow.append('div')
        .attr({
            'class': 'alert alert-' + ops['style_class'] + ' alert-dismissible',
            'role': 'alert'
        })
        .style(style);

    alert_div.append('button')
        .attr({'type': 'button',
               'class': 'close', 
               'data-dismiss': 'alert',
               'aria-label': 'Close'})
        .append('span')
        .attr('aria-hidden', 'true')
        .html('&times;');

    alert_div.append('span')
        .html(ops['text']);
});

function Progress(args) {
    if(!args) args = {};
    // Grab parameters
    var valid_param = ['name', 'parent_id', 'style', 'text', 'steps', 'initial', 'color'];
    Object.keys(args).forEach(function (item) {
        if(valid_param.includes(item)) {
            this[item] = args[item];
        }
    }, this);
    
    // Set defaults if they aren't already set
    this.name      = this.name      || "progress bar";
    this.parent_id = this.parent_id || "#body";
    this.style     = this.style     || 'pagemiddle'; // pagemiddle divmiddle full
    this.text      = this.text      || "Working";
    this.steps     = this.steps     || 100;
    this.initial   = this.initial   || 0;
    this.color     = this.color     || '';
    
    // Make holding containers
    this.container_div = '';
    this.bar_div       = '';
    this.active        = false;
}
Progress.prototype = {
    start: function() {        
        // Start progress bar
        this.container_div = d3.select(this.parent_id)
            .append('div')
            .attr('id', this.name + '_progress_div')
            .attr('class', 'progress ' + this.style);
        
        this.bar_div = this.container_div
            .append('div')
            .attr({
                id: this.name + "_progress",
                class: "progress-bar progress-bar-striped active " + this.color,
                role: "progressbar",
                'aria-valuenow': "0",
                'aria-valuemin': "0",
                'aria-valuemax': "100",
                'transition': "width .1s ease"
            })
            .text(this.text);
        
        this.active = true;
        this.update(this.initial, this.text);
    },
    update: function(step, text) {
        var percentDone =  Math.floor(step * 100 / this.steps);
        this.text = text || this.text;
        
        // Temporary text replacement
        text = this.text;
        text = text.replace('{cur}', step);
        text = text.replace('{max}', this.steps);
        
        this.bar_div
            .attr('aria-valuenow', percentDone + "")
            .style('width', percentDone + "%")
            .text(text);
    },
    end: function() {
        if(this.active) {
            this.container_div.remove();
            this.active = false;
        } else {
            // Nothing, it's already gone
        }
    },
};
