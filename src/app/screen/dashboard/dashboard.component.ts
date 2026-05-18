import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface StatCard {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  iconColor: string;
  iconBg: string;
  icon: 'send' | 'mail' | 'play';
}

interface ActivityItem {
  title: string;
  time: string;
  iconType: 'mail' | 'user' | 'alert' | 'send';
  iconBg: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  chartPeriod = 'Monthly';
  chartData = [60, 45, 75, 90, 65, 80, 100, 55, 70, 85];
  chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];

  statCards: StatCard[] = [
    {
      label: 'Total Sent',
      value: '1.2k',
      subtext: 'vs last 30 days',
      trend: '+12%',
      icon: 'send',
      iconColor: '#574eb1',
      iconBg: 'rgba(87,78,177,0.1)'
    },
    {
      label: 'Unread Messages',
      value: '45',
      subtext: 'Requiring immediate action',
      icon: 'mail',
      iconColor: '#6b7280',
      iconBg: '#e4dfff'
    },
    {
      label: 'Campaigns Active',
      value: '12',
      subtext: '4 scheduled for tomorrow',
      icon: 'play',
      iconColor: '#059669',
      iconBg: '#d1fae5'
    }
  ];

  activityItems: ActivityItem[] = [
    {
      title: 'Summer Blast Campaign sent to 1.2k users',
      time: '2 hours ago',
      iconType: 'mail',
      iconBg: '#e4dfff'
    },
    {
      title: '140 new subscribers joined the newsletter',
      time: '5 hours ago',
      iconType: 'user',
      iconBg: 'rgba(87,78,177,0.1)'
    },
    {
      title: 'Webhook timeout on staging environment',
      time: 'Yesterday',
      iconType: 'alert',
      iconBg: '#ffdad6'
    },
    {
      title: 'Product Update campaign draft approved',
      time: '2 days ago',
      iconType: 'send',
      iconBg: '#f0ecf5'
    }
  ];

  constructor() { }
  ngOnInit(): void { }
}
