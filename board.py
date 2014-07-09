import webapp2
import csv

from webapp2_extras import json

from google.appengine.api import urlfetch
from google.appengine.api import memcache

class BoardHandler(webapp2.RequestHandler):
    def get(self):
        departures = memcache.get('departures')
        if departures is not None:
            self.response.write(departures)
            return

        result = urlfetch.fetch('http://developer.mbta.com/lib/gtrtfs/Departures.csv')
        #result = urlfetch.fetch('http://localhost:8080/static/example.csv')
        if result.status_code == 200:
            response = []
            boardcsv = csv.DictReader(result.content.splitlines())
            for row in boardcsv:
                if row['Origin'] == 'North Station':
                    response.append(row)

            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(json.encode(response))
            memcache.set('departures', response, time=10)

application = webapp2.WSGIApplication([
    ('/board', BoardHandler),
], debug=True)
