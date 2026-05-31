import urllib.request
import json
import datetime
import os
import re

username = "mahiiabdullah"
now = datetime.datetime.now()
first_day_of_month = now.replace(day=1).strftime("%Y-%m-%d")
first_day_of_year = now.replace(month=1, day=1).strftime("%Y-%m-%d")

def get_commit_count(date_from):
    url = f"https://api.github.com/search/commits?q=author:{username}+committer-date:>{date_from}"
    req = urllib.request.Request(url)
    req.add_header('Accept', 'application/vnd.github.cloak-preview')
    req.add_header('User-Agent', 'python-urllib')
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data.get('total_count', 0)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return 0

commits_this_month = get_commit_count(first_day_of_month)
commits_this_year = get_commit_count(first_day_of_year)

print(f"Commits this year: {commits_this_year}")
print(f"Commits this month: {commits_this_month}")

with open('README.md', 'r', encoding='utf-8') as f:
    readme = f.read()

readme = re.sub(r'<!-- COMMITS_MONTH -->.*?<!-- /COMMITS_MONTH -->', f'<!-- COMMITS_MONTH -->{commits_this_month}<!-- /COMMITS_MONTH -->', readme, flags=re.DOTALL)
readme = re.sub(r'<!-- COMMITS_YEAR -->.*?<!-- /COMMITS_YEAR -->', f'<!-- COMMITS_YEAR -->{commits_this_year}<!-- /COMMITS_YEAR -->', readme, flags=re.DOTALL)

with open('README.md', 'w', encoding='utf-8') as f:
    f.write(readme)
