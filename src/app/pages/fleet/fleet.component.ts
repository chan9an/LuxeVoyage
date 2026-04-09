import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Jet {
  category: string;
  name: string;
  pricePerHour: number;
  capacity: number;
  rangeNm: number;
  speed: string;
  amenityIcon: string;
  amenityText: string;
  imageUrl: string;
}

@Component({
  selector: 'app-fleet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fleet.component.html'
})
export class FleetComponent {
  minRangeFilter: number = 3000;
  
  allJets: Jet[] = [
    {
      category: 'Ultra Long Range',
      name: 'Gulfstream G650',
      pricePerHour: 1150000,
      capacity: 19,
      rangeNm: 7000,
      speed: 'Mach 0.925',
      amenityIcon: 'star',
      amenityText: 'Full-size Bed',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQU1Bsr7tTrGbeqL0egxx8yMvso0J6ZWoNTAZ-h4A0u5JeEOvXRrM8y6gqqPYFKsY1vXdusXE6s00EBYNlh0HKJ_056J85ct7J_OBMZUxFos5zL0NFeNnO5gfgvLCTku1sqVJ72kw9rRR32YW1cAKNXF14t8t4xI8XA9cmaoyEsTOH8r73AWC1XUVIsfPtmc2UCOTlbX0TJURbT1RdXWDh_KOFsFA2v5wW-i5pRouB5Z9TtRMn0Kumjx87cnYmFrQfB9SrZ-58JoM'
    },
    {
      category: 'The Masterpiece',
      name: 'Global 7500',
      pricePerHour: 1400000,
      capacity: 14,
      rangeNm: 7700,
      speed: 'Mach 0.90',
      amenityIcon: 'restaurant',
      amenityText: 'Gourmet Kitchen',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAk0WZQVl4CBqJs0QdCKDAExUQMCot-rUyC_IyEqh4powoVwTRZ5cQJT6bezNoF-JspPJqwkqfzTUyMk1FSyA0b-jpJUVqlphwfGgb0-nTLd67Tdux3RbeaUf4fmLnn76vo1Evm82zZFovhPZW2j6_RaGbbtXp7gJoWX9pBqf72aQv3JnBG7tocMIzn8oB_6zKRWnV9v9DStBeA7eMdyyybPtGor2PfUUbLhCAn9dl9mvmnoM3K4q3ksqtLwukWl1gOFsQb-x0O4Qg'
    },
    {
      category: 'Future Aerospace',
      name: 'LuxeVoyage Concept X',
      pricePerHour: 2200000,
      capacity: 18,
      rangeNm: 8500,
      speed: 'Mach 0.98',
      amenityIcon: 'diamond',
      amenityText: 'Panoramic Skylight',
      imageUrl: '/private_jet_exterior_1775546546953.png'
    },
    {
      category: 'Advanced Tri-Jet',
      name: 'Falcon 8X',
      pricePerHour: 920000,
      capacity: 12,
      rangeNm: 6450,
      speed: 'Mach 0.90',
      amenityIcon: 'volume_off',
      amenityText: 'Silent Cabin Technology',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbBLCBZLqmWPJFSDBiMMcSrieusSb-Cp6VU2qAx2hy8O3qMB1_sPkcUjwMAWo2FA2VaMArAIbCXRvV-o5qKUn0-TIQl8P-mC0WEKmc6-BXCcoq7kQzTdBGtLdFjV2Z7CB6tMhwy4h_yZ-7pOYctgPbU4iIMS7uxUJ_rOFRZkLO0vhg0kAecSXBLN5e8zTuEa9hxmKZTZFUByDfY3uZ7sdPLDBnDQMVY14z73qOjkm2EcNZayG7hPWiM27waL-k09D7lwdBJbkpDSs'
    },
    {
      category: 'Agile Luxury',
      name: 'Challenger 350',
      pricePerHour: 650000,
      capacity: 9,
      rangeNm: 3200,
      speed: 'Mach 0.83',
      amenityIcon: 'wifi',
      amenityText: 'KA-Band High Speed Wi-Fi',
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA5r7FdgrUt9yCv4q6onq3FUIUc6FzCXsFKF8AC8pTYGMt4YqSTlsHGKsG2NA78JZMwPno8AT-FBMKNfSNfT_LnyPymMRazt8LKSxDxvD_ozxP-KmVJ9rwD78BcZf-Non0clOQV8C4jSxbyTwpHP_43ZOfHKMfFLjRjvzSM-hB0riSp5cnsnogx6iX11d1tn34S0dSoKd18vFxB1p8gmRg2Rmy3XUODMEJeTDbnxlWLnWPayvxzG1sM1EnD4BzlV01LRINzQPAHBn8'
    },
    {
      category: 'Presidential Suite',
      name: 'Boeing BBJ 787',
      pricePerHour: 3500000,
      capacity: 40,
      rangeNm: 9900,
      speed: 'Mach 0.85',
      amenityIcon: 'bed',
      amenityText: 'Master Bedroom Suite',
      imageUrl: '/private_jet_interior_1775546633858.png'
    }
  ];

  get filteredJets() {
    return this.allJets.filter(j => j.rangeNm >= this.minRangeFilter);
  }
}
