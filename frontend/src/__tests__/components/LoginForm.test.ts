import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import LoginForm from '@/components/LoginForm.vue'

// Mock the auth store
const mockAuthStore = {
  login: vi.fn(),
  isLoading: false,
  error: null,
  clearError: vi.fn(),
}

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div>Home</div>' } },
    { path: '/login', component: { template: '<div>Login</div>' } },
  ],
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthStore.isLoading = false
    mockAuthStore.error = null
  })

  it('renders login form correctly', () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('h2').text()).toBe('School Fee Payment Portal')
    expect(wrapper.find('input[name="username"]').exists()).toBe(true)
    expect(wrapper.find('input[name="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
  })

  it('disables submit button when form is invalid', () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('enables submit button when form is valid', async () => {
    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    const usernameInput = wrapper.find('input[name="username"]')
    const passwordInput = wrapper.find('input[name="password"]')

    await usernameInput.setValue('testuser')
    await passwordInput.setValue('password123')

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBeUndefined()
  })

  it('calls login function on form submit', async () => {
    mockAuthStore.login.mockResolvedValue(true)

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    const usernameInput = wrapper.find('input[name="username"]')
    const passwordInput = wrapper.find('input[name="password"]')
    const form = wrapper.find('form')

    await usernameInput.setValue('testuser')
    await passwordInput.setValue('password123')
    await form.trigger('submit.prevent')

    expect(mockAuthStore.login).toHaveBeenCalledWith('testuser', 'password123')
  })

  it('displays error message when login fails', async () => {
    mockAuthStore.error = 'Invalid credentials'

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    expect(wrapper.find('.bg-red-50').exists()).toBe(true)
    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('shows loading state during login', () => {
    mockAuthStore.isLoading = true

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.text()).toContain('Signing in...')
    expect(submitButton.attributes('disabled')).toBeDefined()
  })

  it('clears error when close button is clicked', async () => {
    mockAuthStore.error = 'Some error'

    const wrapper = mount(LoginForm, {
      global: {
        plugins: [router],
      },
    })

    const closeButton = wrapper.find('.bg-red-50 button')
    await closeButton.trigger('click')

    expect(mockAuthStore.clearError).toHaveBeenCalled()
  })
})