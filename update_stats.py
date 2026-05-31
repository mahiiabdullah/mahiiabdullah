import urllib.request
import json
import datetime
import os
import re

username = "mahiiabdullah"
now = datetime.datetime.now()
first_day_of_month = now.replace(day=1).strftime("%Y-%m-%d")
first_day_of_year = now.replace(month=1, day=1).strftime("%Y-%m-%d")

def get_contribution_count(date_from, date_to):
    url = f"https://github.com/users/{username}/contributions?from={date_from}&to={date_to}"
    req = urllib.request.Request(url)
    req.add_header('User-Agent', 'python-urllib')
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            match = re.search(r'([\d,]+)\s+contributions', html)
            if match:
                return int(match.group(1).replace(',', ''))
            return 0
    except Exception as e:
        print(f"Error fetching data: {e}")
        return 0

last_day_of_month = (now.replace(month=now.month % 12 + 1, day=1) - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
last_day_of_year = now.replace(month=12, day=31).strftime("%Y-%m-%d")

contribs_this_month = get_contribution_count(first_day_of_month, last_day_of_month)
contribs_this_year = get_contribution_count(first_day_of_year, last_day_of_year)

print(f"Contributions this year: {contribs_this_year}")
print(f"Contributions this month: {contribs_this_month}")

with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

readme = re.sub(r'<!-- CONTRIBS_MONTH -->.*?<!-- /CONTRIBS_MONTH -->', f'<!-- CONTRIBS_MONTH -->{contribs_this_month}<!-- /CONTRIBS_MONTH -->', readme, flags=re.DOTALL)
readme = re.sub(r'<!-- CONTRIBS_YEAR -->.*?<!-- /CONTRIBS_YEAR -->', f'<!-- CONTRIBS_YEAR -->{contribs_this_year}<!-- /CONTRIBS_YEAR -->', readme, flags=re.DOTALL)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)
