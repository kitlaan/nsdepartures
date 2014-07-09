import os
import csv
import datetime

import jinja2
import webapp2
from webapp2_extras import json

from google.appengine.api import urlfetch
from google.appengine.api import memcache

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
    extensions=['jinja2.ext.autoescape'],
    autoescape=True)

def fetchData():
    departures = memcache.get('departures')
    if departures is not None:
        return departures

    result = urlfetch.fetch('http://developer.mbta.com/lib/gtrtfs/Departures.csv')
    #result = urlfetch.fetch('http://localhost:8080/static/example.csv')
    if result.status_code == 200:
        response = []
        boardcsv = csv.DictReader(result.content.splitlines())
        for row in boardcsv:
            if row['Origin'] == 'North Station':
                response.append(row)

        memcache.set('departures', response, time=10)
        return response

    return None

class BoardHandler(webapp2.RequestHandler):
    def get(self):
        departures = fetchData()
        if departures is not None:
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(json.encode(departures))

class NoJsHandler(webapp2.RequestHandler):
    def get(self):
        departures = fetchData()
        if departures is not None:
            nowtime = datetime.datetime.now()

            for row in departures:
                timestamp = datetime.datetime.fromtimestamp(int(row['ScheduledTime']))
                row['ScheduledTime'] = timestamp.strftime("%H:%M")

            template_values = {
                'refreshtime': 'last updated',
                'dayofweek': nowtime.strftime("%A"),
                'curdate': nowtime.strftime("%Y-%m-%d"),
                'curtime': nowtime.strftime("%H:%M") + ' utc',
                'tracks': departures,
            }
            template = JINJA_ENVIRONMENT.get_template('board.templ')
            self.response.write(template.render(template_values))

application = webapp2.WSGIApplication([
    ('/board', BoardHandler),
    ('/nojs.html', NoJsHandler),
], debug=True)
