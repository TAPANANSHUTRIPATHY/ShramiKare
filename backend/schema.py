from typing import List, Optional, Dict
from pydantic import BaseModel
from datetime import date

class Company(BaseModel):
    name: str
    from_date: date
    to_date: Optional[date] = None
    working: bool

class Records(BaseModel):
    # Boolean flags for vaccinations/checkups
    vaccination1: bool
    vaccination2: bool
    # Add other booleans as needed
    specialNotes: Optional[str] = None

class Migrant(BaseModel):
    name: str
    address: str
    aadhaarNumber: str
    originState: str
    originDistrict: str
    destinationDistrict: str
    language: Optional[str] = None  # preferred language code/string
    records: Records
    companies: List[Company]

# Example Usage
# migrant = Migrant(
#     name="John Doe",
#     address="123 Street Name",
#     aadhaarNumber="1234-5678-9012",
#     originState="Odisha",
#     originDistrict="Cuttack",
#     destinationDistrict="Ernakulam",
#     language="Malayalam",
#     records=Records(
#         vaccination1=True,
#         vaccination2=False,
#         specialNotes="Allergy to XYZ"
#     ),
#     companies=[
#         Company(name="ABC Constructions", from_date=date(2024,1,1), to_date=date(2024,6,30), working=False),
#         Company(name="XYZ Hospitality", from_date=date(2024,7,1), working=True)
#     ]
# )
