#!/usr/bin/env python

import json, re, argparse
from pprint import pprint
from server_messenger import ServerMessenger
import mysql.connector
import gspread # installed via pip install gspread
from oauth2client.client import SignedJwtAssertionCredentials
import parse_raw_JSON

serverCapture = None
serverStorage = None
googleAPI = None

# Queries
query_get_coder = ("SELECT * FROM Coder "
                   "WHERE ShortName = %(name)s ; ")
query_push_code = ("REPLACE INTO Code "
                   "(Rumor, Period, Tweet, Coder, "
                   " Uncodable, Unrelated, Affirm, Deny, Neutral, "
                   " Implicit, Ambiguity, Uncertainty, Difficult, Text) "
                   "VALUES (%(Rumor)s, %(Period)s, %(Tweet)s, %(Coder)s, "
                   " %(Uncodable)s, %(Unrelated)s, %(Affirm)s, %(Deny)s, %(Neutral)s, "
                   " %(Implicit)s, %(Ambiguity)s, %(Uncertainty)s, %(Difficult)s, %(Text)s); ")
query_add_tweet = ("INSERT IGNORE INTO Tweet "
                   "(ID, Text, `Distinct`, Type, Username, Timestamp, Origin) "
                   "VALUES (%(ID)s, %(Text)s, %(Distinct)s, %(Type)s, %(Username)s, %(Timestamp)s, %(Origin)s) ")

def main():
    parser = argparse.ArgumentParser(description='Parse a raw collection into the important constituents and/or calculate statistics on the collection',
                                add_help=True)
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="Increase output verbosity")
    parser.add_argument("-c", "--config", required=False, default='../../local.conf',
                        help='Name of configuration file')
    parser.add_argument("-r", "--rumor_id", required=False, default='0',
                        help='Which rumor to choose')
    parser.add_argument("-e", "--event_name", required=False, default='Event',
                        help='Name of the Event')
    parser.add_argument("-q", "--rumor_name", required=False, default='Rumor',
                        help='Name of the Rumor')
    parser.add_argument("-p", "--period", required=False, type=int, default=0,
                        help='Number for the period')
    
    global options
    options = parser.parse_args()

    connectToServer()
    cursor = serverStorage.cursor()
    
    # Set parameters
#    event_name = "Sydney Siege" # Umpqua Paris
#    rumor_name = "Hadley" # Crisis Actors Bot Prediction
    periods = ['Training 4', 'Training 3', 'Training 2', 'Training', 'Coding', 'Adjudication'];
    period_name = periods[options.period + 4];
    
#    rumor_id = 10
#    period_id = -1
    
    search_title = ' ' + options.event_name + ' ' + options.rumor_name + ' ' + period_name
    
    # Open spreadsheets
#    spreadsheet = googleAPI.open('Conrad Umpqua Crisis Actors Coding Sheet')
    sheets = googleAPI.openall();
    for sheet in sheets:
        title = None
        for entry in sheet._feed_entry:
            if(entry.text and 
               search_title in entry.text and 
               (options.period is not -1 or not any(num in entry.text for num in ['2', '3', '4', '5']))):
                title = entry.text
                
        if(title):
            name = title.split(' ')[0]
            print(name)
            cursor.execute(query_get_coder, {'name': name})
            coder_id = cursor.fetchone()[0]
            
            worksheet = sheet.get_worksheet(0)
            codes = worksheet.get_all_records()
            
            for code in codes:
                code['Coder']     = coder_id
                code['Rumor']     = options.rumor_id
                code['Period']    = options.period
                code['Uncodable'] = bool(code['Uncodable']) if 'Uncodable' in code else 0
                code['Unrelated'] = bool(code['Unrelated']) if 'Unrelated' in code else 0
                code['Affirm']    = bool(code['Affirm'])    if 'Affirm' in code else 0
                code['Deny']      = bool(code['Deny'])      if 'Deny' in code else 0
                code['Neutral']   = bool(code['Neutral'])   if 'Neutral' in code else 0
                code['Implicit']  = bool(code['Implicit'])  if 'Implicit' in code else 0
                code['Ambiguity'] = bool(code['Ambiguity']) if 'Ambiguity' in code else 0
                code['Uncertainty'] = bool(code['Uncertainty']) if 'Uncertainty' in code else 0
                code['Difficult'] = bool(code['Difficult']) if 'Difficult' in code else 0
                
                if('text' in code):
                    code['Text'] = code['text']
                if('tweet_id' in code):
                    code['Tweet'] = code['tweet_id']
                if('Tweet_ID' in code):
                    code['Tweet'] = code['Tweet_ID']
                if('id' in code):
                    code['Tweet'] = code['id']
                # note: all integers are long in python3
                if(isinstance(code['Tweet'], str)):
                    code['Tweet'] = int(float(code['Tweet'].replace(',','')));
                if(isinstance(code['Tweet'], float)):
                    code['Tweet'] = int(float(code['Tweet']));
#                parse_raw_JSON.printNested(code)
                code['Text'] = parse_raw_JSON.norm_unicode(code['Text'])
                    
                
                cursor.execute(query_push_code, code)
        serverStorage.commit()
    cursor.close()
    
    if(serverStorage is not None):
        serverStorage.close()
                        
def connectToServer():
    if(options.verbose): print("    Connecting to Captures Database")
    
    with open(options.config) as config_file:
        config = json.load(config_file)
        
        # MySQL Storage
        global serverStorage
        serverStorage = mysql.connector.connect(
            user=config["storage"]["user"],
            password=config["storage"]["password"],
            host=config["storage"]["host"],
            database=config["storage"]["database"]
        )
            
        global googleAPI
        scope = ['https://spreadsheets.google.com/feeds']
        credentials = SignedJwtAssertionCredentials(config["google_api"]['client_email'], config["google_api"]['private_key'].encode(), scope)
        googleAPI = gspread.authorize(credentials)

if __name__ == "__main__":
    main()
